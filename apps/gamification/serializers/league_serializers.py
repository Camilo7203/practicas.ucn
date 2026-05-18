from rest_framework import serializers
from core.shared.models.points.leagues.league import League
from core.shared.models.points.leagues.division import Division
from core.shared.models.users.organization import Organization
from mongoengine.errors import DoesNotExist


class DivisionSerializer(serializers.Serializer):
    """Serializer for Division model"""
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    max_points = serializers.IntegerField(required=True, min_value=0)
    is_active = serializers.BooleanField(default=True)
    order = serializers.IntegerField(required=True, min_value=1)
    icon = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """Create a new division"""
        division = Division(**validated_data)
        division.save()
        return division

    def update(self, instance, validated_data):
        """Update a division"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convert Division instance to dict"""
        return {
            'id': str(instance.id),
            'name': instance.name,
            'description': instance.description or '',
            'max_points': instance.max_points,
            'is_active': instance.is_active,
            'order': instance.order,
            'icon': instance.icon or '',
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }


class LeagueSerializer(serializers.Serializer):
    """Serializer for League model"""
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    point_name = serializers.CharField(required=True, max_length=100)
    is_active = serializers.BooleanField(default=True)
    organization = serializers.CharField(required=True)
    divisions = serializers.ListField(
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

    def validate_divisions(self, value):
        """Validate divisions exist"""
        if value:
            divisions = Division.objects(id__in=value)
            if len(divisions) != len(value):
                raise serializers.ValidationError("One or more divisions not found")
            return list(divisions)
        return []

    def create(self, validated_data):
        """Create a new league"""
        divisions = validated_data.pop('divisions', [])
        organization = validated_data.pop('organization')
        
        league = League(
            organization=organization,
            **validated_data
        )
        
        if divisions:
            league.divisions = divisions
        
        league.save()
        return league

    def update(self, instance, validated_data):
        """Update a league"""
        if 'divisions' in validated_data:
            divisions = validated_data.pop('divisions')
            instance.divisions = divisions
        
        if 'organization' in validated_data:
            instance.organization = validated_data.pop('organization')
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

    def to_representation(self, instance):
        """Convert League instance to dict"""
        divisions_detail = []
        if instance.divisions:
            for div in instance.divisions:
                div_serializer = DivisionSerializer(div)
                divisions_detail.append(div_serializer.to_representation(div))
        
        return {
            'id': str(instance.id),
            'name': instance.name,
            'description': instance.description or '',
            'point_name': instance.point_name,
            'is_active': instance.is_active,
            'organization': str(instance.organization.id) if instance.organization else None,
            'divisions': [str(div.id) for div in instance.divisions] if instance.divisions else [],
            'divisions_detail': divisions_detail,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
        }
