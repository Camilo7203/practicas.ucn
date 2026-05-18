from rest_framework import serializers
from core.shared.models.templates.blacklist import BlackList
from core.shared.models.agents.agent import Agent


class BlackListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True)
    agent_id = serializers.CharField(required=True)
    active = serializers.BooleanField(required=False, default=True)
    provider = serializers.CharField(required=False, default="whatsapp")
    numbers = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        allow_empty=False,
    )
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate_provider(self, value):
        provider = (value or "whatsapp").strip().lower()
        if provider != "whatsapp":
            raise serializers.ValidationError("Solo se soporta provider whatsapp")
        return provider

    def validate_agent_id(self, value):
        request = self.context.get("request")
        if request is None or not getattr(request, "user", None):
            raise serializers.ValidationError("No se pudo validar el agente")

        organization = getattr(request.user, "organization", None)
        if organization is None:
            raise serializers.ValidationError("Usuario no pertenece a ninguna organización")

        try:
            agent = Agent.objects.get(id=value)
        except Exception:
            raise serializers.ValidationError("Agente no encontrado")

        if str(agent.organization.id) != str(organization.id):
            raise serializers.ValidationError("El agente no pertenece a tu organización")

        return agent

    def validate_numbers(self, value):
        normalized_numbers = []
        for number in value:
            normalized = BlackList.normalize_number(number)
            if normalized:
                normalized_numbers.append(normalized)

        unique_numbers = sorted(set(normalized_numbers))
        if not unique_numbers:
            raise serializers.ValidationError("Debes enviar al menos un número válido")

        return unique_numbers

    def create(self, validated_data):
        request = self.context.get("request")
        organization = request.user.organization
        agent = validated_data.pop("agent_id")

        blacklist = BlackList(
            organization=organization,
            agent=agent,
            **validated_data,
        )
        blacklist.save()
        return blacklist

    def update(self, instance, validated_data):
        if "name" in validated_data:
            instance.name = validated_data["name"]
        if "active" in validated_data:
            instance.active = validated_data["active"]
        if "provider" in validated_data:
            instance.provider = validated_data["provider"]
        if "numbers" in validated_data:
            instance.numbers = validated_data["numbers"]
        if "reason" in validated_data:
            instance.reason = validated_data["reason"]
        if "agent_id" in validated_data:
            instance.agent = validated_data["agent_id"]

        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "name": instance.name,
            "organization_id": str(instance.organization.id) if instance.organization else None,
            "agent_id": str(instance.agent.id) if instance.agent else None,
            "active": instance.active,
            "provider": instance.provider,
            "numbers": instance.numbers,
            "reason": instance.reason,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }
