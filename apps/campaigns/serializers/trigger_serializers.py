from rest_framework import serializers
from core.shared.models.elements.triggers.trigger import Trigger
from core.shared.models.users.organization import Organization
from ..utils.build_cron_expression import build_cron_expression

class TriggerSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()
    sub_type = serializers.CharField()
    configuration = serializers.DictField(default=dict)
    organization = serializers.CharField(required=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    checkpoint_name = serializers.CharField(required=True)
    default_next_element = serializers.CharField(required=False)

    def validate_organization(self, value):
        try:
            org = Organization.objects.get(id=value)
        except Exception:
            raise serializers.ValidationError("Organization does not exist or invalid ID")
        return org

    def create(self, validated_data):
        org = validated_data.pop("organization")
        trigger = Trigger(organization=org, **validated_data)
        trigger.save()
        return trigger

    def to_representation(self, instance):
        return {
            "name": instance.name,
            "type": instance.type,
            "sub_type": instance.sub_type,
            "configuration": getattr(instance, "configuration", {}),
            "organization": str(instance.organization.id) if getattr(instance, "organization", None) else None,
            "created_at": getattr(instance, "created_at", None),
            "updated_at": getattr(instance, "updated_at", None),
            "checkpoint_name": instance.checkpoint_name,
            "default_next_element": instance.default_next_element ,
        }

    def validate(self, attrs):
        trigger_type = attrs.get("sub_type")
        config = attrs.get("configuration", {})

        # Define required configuration fields for each trigger type
        config_schemas = {
            "onClick": [],
            "scheduled": ["intervalType", "intervalValue"],
            "webhook": ["url", "method"],  # e.g., url: str, method: "POST"/"GET"
            "onArrival": ["page"],  # e.g., page: "/welcome"
            "idle": ["timeout"],  # e.g., timeout: seconds
            "onTag": ["tag"],  # e.g., tag: "VIP"
        }

        required_fields = config_schemas.get(trigger_type, None)
        if required_fields is None:
            raise serializers.ValidationError({"type": "Unknown trigger type."})

        # Allow default_next_element to be null
        if "default_next_element" in attrs and attrs["default_next_element"] in ("", None):
            attrs["default_next_element"] = None

        missing = [f for f in required_fields if f not in config]
        if missing:
            raise serializers.ValidationError({
                "configuration": f"Missing required fields for '{trigger_type}': {', '.join(missing)}"
            })

        # Backend cron logic for scheduled triggers
        if trigger_type == "scheduled":
            cron_expression = build_cron_expression(config)
            config["cron"] = cron_expression
            # Clean up config
            for key in ["intervalType", "intervalValue", "customCron", "triggerAtHour", "triggerAtMinute", "triggerOnWeekDays", "triggerOnMonthDays"]:
                config.pop(key, None)
            attrs["configuration"] = config

        # Optionally: add more detailed validation per field/type here

        return attrs
