"""Shared rate limiter instance.

Kept in its own module so both api.main (which attaches it to the app and
registers the error handler) and api.routes (which decorates endpoints) can
import the same Limiter without a circular import.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# V4 FIX: Rate Limiting
limiter = Limiter(key_func=get_remote_address)
