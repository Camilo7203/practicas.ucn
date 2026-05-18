import re
import mongoengine as me
from ..base import BaseModel
from ..agents.agent import Agent
from ..users.organization import Organization


class BlackList(BaseModel):
    """Representa un lista a las que no se les puede enviar mensajes."""

    name = me.StringField(required=True)
    organization = me.ReferenceField(Organization, required=True)
    agent = me.ReferenceField(Agent, required=True)
    active = me.BooleanField(required=True, default=True)
    provider = me.StringField(
        required=True,
        default="whatsapp",
        choices=["whatsapp"],
    )
    numbers = me.ListField(me.StringField(), required=True, default=list)
    reason = me.StringField(default="")

    meta = {
        "collection": "blackList",
        "indexes": [
            ("organization", "agent", "provider", "active"),
            "numbers",
        ],
    }

    @staticmethod
    def normalize_number(number: str) -> str:
        """Normaliza un número removiendo todo excepto dígitos."""

        if not number:
            return ""
        return re.sub(r"\D", "", number)

    def clean(self):
        normalized = [self.normalize_number(number) for number in self.numbers]
        normalized = [number for number in normalized if number]
        self.numbers = sorted(set(normalized))

        if not self.numbers:
            raise me.ValidationError("numbers debe contener al menos un número válido")

    def blocks_number(self, number: str) -> bool:
        """Retorna True si este registro bloquea el número."""

        normalized = self.normalize_number(number)
        return bool(normalized and normalized in self.numbers)

    @classmethod
    def is_number_blocked(cls, organization, number: str, agent=None, provider="whatsapp") -> bool:
        """Retorna True si el número está bloqueado para la organización/agente/proveedor."""

        normalized = cls.normalize_number(number)
        if not normalized:
            return False

        query = cls.objects(
            organization=organization,
            active=True,
            provider=provider,
            numbers=normalized,
        )

        if agent is not None:
            query = query.filter(agent=agent)

        return query.first() is not None

