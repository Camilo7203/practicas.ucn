def build_cron_expression(config):
    interval_type = config.get("intervalType")
    interval_value = config.get("intervalValue", 1)
    trigger_at_minute = config.get("triggerAtMinute", 0)
    trigger_at_hour = config.get("triggerAtHour", 0)
    trigger_on_weekdays = config.get("triggerOnWeekDays", [])  # Array of weekdays (0-6)
    trigger_on_monthdays = config.get("triggerOnMonthDays", [])  # Array of month days (1-31)
    if not interval_type:
        return ""
    if interval_type == "ever x seconds":
        return f"*/{interval_value} * * * * *"
    elif interval_type == "ever x minutes":
        return f"0 */{interval_value} * * * *"
    elif interval_type == "ever x hours":
        return f"0 {trigger_at_minute} */{interval_value} * * *"
    elif interval_type == "ever x days":
        return f"{trigger_at_minute} {trigger_at_hour} */{interval_value} * *"
    elif interval_type == "ever x weeks":
        return f"{trigger_at_minute} {trigger_at_hour} * * {','.join(str(d) for d in trigger_on_weekdays)}"
    elif interval_type == "ever x months":
        return f"{trigger_at_minute} {trigger_at_hour} {','.join(str(d) for d in trigger_on_monthdays) if trigger_on_monthdays else '1'} */{interval_value} *"
    elif interval_type == "custom":
        return config.get("customCron", "")
    return ""

