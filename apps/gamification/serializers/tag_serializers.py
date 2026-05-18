from rest_framework import serializers
from core.shared.models.tags.tag import Tag
from core.shared.models.users.activist import Activist
from core.shared.models.users.organization import Organization
from mongoengine.errors import DoesNotExist


class TagSerializer(serializers.Serializer):
    """Serializer for Tag model"""
    id = serializers.CharField(read_only=True)
    activist = serializers.CharField(required=True)
    tag = serializers.CharField(required=True, max_length=200)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate_activist(self, value):
        """Validate activist exists"""
        try:
            activist = Activist.objects.get(id=value)
            return activist
        except DoesNotExist:
            raise serializers.ValidationError("Activist not found")

    def create(self, validated_data):
        """Create a new tag"""
        tag = Tag(**validated_data)
        tag.save()
        return tag

    def update(self, instance, validated_data):
        """Update a tag"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convert Tag instance to dict"""
        return {
            'id': str(instance.id),
            'activist': str(instance.activist.id),
            'tag': instance.tag,
            'is_active': instance.is_active,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }


class TagCreateSerializer(serializers.Serializer):
    """Serializer for creating/assigning tags to activist"""
    activist_id = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    tag = serializers.CharField(required=True, max_length=200)

    def validate(self, data):
        """Validate that either activist_id or phone is provided"""
        activist_id = data.get('activist_id')
        phone = data.get('phone')
        
        if not activist_id and not phone:
            raise serializers.ValidationError(
                "Debes proporcionar el ID del activista o el número de teléfono"
            )
        
        # If activist_id is provided, validate it exists
        if activist_id:
            try:
                activist = Activist.objects.get(id=activist_id)
                data['activist_id'] = activist
            except DoesNotExist:
                raise serializers.ValidationError("Activist not found")
        
        # If phone is provided, find the activist by phone
        if phone and not activist_id:
            try:
                activist = Activist.objects.get(phone=phone)
                data['activist_id'] = activist
            except DoesNotExist:
                raise serializers.ValidationError("Activista con este teléfono no encontrado")
        
        # Check if tag already exists for this activist
        activist = data.get('activist_id')
        tag_name = data.get('tag')
        
        if activist:
            existing_tag = Tag.objects(activist=activist, tag=tag_name, is_active=True).first()
            if existing_tag:
                raise serializers.ValidationError("Este tag ya está asignado a este activista")
        
        return data


class BulkTagAssignSerializer(serializers.Serializer):
    """Serializer for bulk tag assignment"""
    activist_ids = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        allow_empty=False
    )
    tag = serializers.CharField(required=True, max_length=200)

    def validate_activist_ids(self, value):
        """Validate all activists exist"""
        activists = Activist.objects(id__in=value)
        if len(activists) != len(value):
            raise serializers.ValidationError("Uno o más activistas no fueron encontrados")
        return list(activists)


class ActivistTagsSerializer(serializers.Serializer):
    """Serializer for getting all tags for an activist"""
    activist_id = serializers.CharField(required=True)
    include_inactive = serializers.BooleanField(default=False, required=False)

    def validate_activist_id(self, value):
        """Validate activist exists"""
        try:
            activist = Activist.objects.get(id=value)
            return activist
        except DoesNotExist:
            raise serializers.ValidationError("Activist not found")
