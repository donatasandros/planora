def format_time(seconds: int):
    if seconds < 60:
        return f"{seconds}s"

    minutes, seconds = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m {seconds}s" if seconds else f"{minutes}m"

    hours, minutes = divmod(minutes, 60)
    return (
        f"{hours}h {minutes}m {seconds}s"
        if minutes and seconds
        else f"{hours}h {minutes}m" if minutes else f"{hours}h"
    )
