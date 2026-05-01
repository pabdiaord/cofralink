from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    # AbstractUser ya incluye username, email y password
    # Solo sobreescribimos lo necesario
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email