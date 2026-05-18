import mongoengine as me
from datetime import datetime


class BaseModel(me.Document):
    """Clase base para todos los documentos en el sistema."""
    meta = {"abstract": True}
    created_at = me.DateTimeField(default=datetime.now)
    updated_at = me.DateTimeField(default=datetime.now)

    def save(self, *args, **kwargs):
        """Actualizar updated_at en cada guardado."""
        self.updated_at = datetime.now()
        return super().save(*args, **kwargs)
