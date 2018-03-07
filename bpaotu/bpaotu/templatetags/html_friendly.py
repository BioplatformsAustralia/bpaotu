from django import template

register = template.Library()

@register.filter
def html_friendly(str):
    str = str.replace(" ", "")
    str = str.lower()
    return str
