from rest_framework import serializers
from core.shared.models.points.stores.store import Store
from core.shared.models.points.stores.store_item import StoreItem
from core.shared.models.users.organization import Organization
from mongoengine.errors import DoesNotExist


class StoreItemSerializer(serializers.Serializer):
    """Serializer for StoreItem model"""
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)
    price = serializers.IntegerField(required=True, min_value=0)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """Create a new store item"""
        store_item = StoreItem(**validated_data)
        store_item.save()
        return store_item

    def update(self, instance, validated_data):
        """Update a store item"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convert StoreItem instance to dict"""
        return {
            'id': str(instance.id),
            'name': instance.name,
            'description': instance.description or '',
            'is_active': instance.is_active,
            'price': instance.price,
            'image': instance.image or '',
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }


class StoreSerializer(serializers.Serializer):
    """Serializer for Store model"""
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.CharField(required=True, max_length=50)
    is_active = serializers.BooleanField(default=True)
    organization = serializers.CharField(required=True)
    store_items = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate_organization(self, value):
        """Validate organization exists"""
        try:
            org = Organization.objects.get(id=value)
            return org
        except DoesNotExist:
            raise serializers.ValidationError("Organization not found")

    def validate_store_items(self, value):
        """Validate store items exist"""
        if value:
            items = StoreItem.objects(id__in=value)
            if len(items) != len(value):
                raise serializers.ValidationError("One or more store items not found")
            return list(items)
        return []

    def create(self, validated_data):
        """Create a new store"""
        store_items = validated_data.pop('store_items', [])
        organization = validated_data.pop('organization')
        
        store = Store(
            organization=organization,
            **validated_data
        )
        
        if store_items:
            store.store_items = store_items
        
        store.save()
        return store

    def update(self, instance, validated_data):
        """Update a store"""
        if 'store_items' in validated_data:
            store_items = validated_data.pop('store_items')
            instance.store_items = store_items
        
        if 'organization' in validated_data:
            instance.organization = validated_data.pop('organization')
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convert Store instance to dict"""
        items_detail = []
        if instance.store_items:
            for item in instance.store_items:
                item_serializer = StoreItemSerializer(item)
                items_detail.append(item_serializer.to_representation(item))
        
        return {
            'id': str(instance.id),
            'name': instance.name,
            'description': instance.description or '',
            'currency': instance.currency,
            'is_active': instance.is_active,
            'organization': str(instance.organization.id) if instance.organization else None,
            'store_items': [str(item.id) for item in instance.store_items] if instance.store_items else [],
            'store_items_detail': items_detail,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }
