from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# User Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_verified: bool


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    token: str


# Audio Models
class AudioBase(BaseModel):
    title: str
    description: Optional[str]
    file_url: str


class AudioCreate(AudioBase):
    pass


class AudioResponse(AudioBase):
    id: int
    uploaded_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Tag (Category) Models
class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int

    class Config:
        from_attributes = True


# AudioTag Models (Relationship between Audio and Tags)
class AudioTagBase(BaseModel):
    audio_id: int
    tag_id: int


class AudioTagResponse(AudioTagBase):
    id: int

    class Config:
        from_attributes = True


# Like Models
class LikeBase(BaseModel):
    audio_id: int
    user_id: int


class LikeResponse(LikeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Favorite Models
class FavoriteBase(BaseModel):
    audio_id: int
    user_id: int


class FavoriteResponse(FavoriteBase):
    id: int
    added_at: datetime

    class Config:
        from_attributes = True


# Last Played Models
class LastPlayedBase(BaseModel):
    audio_id: int
    user_id: int


class LastPlayedResponse(LastPlayedBase):
    id: int
    last_played_at: datetime

    class Config:
        from_attributes = True


# Stream Models
class StreamBase(BaseModel):
    audio_id: int
    user_id: Optional[int]


class StreamResponse(StreamBase):
    id: int
    streamed_at: datetime

    class Config:
        from_attributes = True
