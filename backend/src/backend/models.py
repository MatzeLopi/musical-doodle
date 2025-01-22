from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    TIMESTAMP,
    UniqueConstraint,
    Boolean,
    UUID,
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


# Table: Users
class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    audios = relationship(
        "Audio", back_populates="uploaded_by_user", cascade="all, delete-orphan"
    )
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )
    last_played = relationship(
        "LastPlayed", back_populates="user", cascade="all, delete-orphan"
    )
    streams = relationship("Stream", back_populates="user")


# Table: Audios
class Audio(Base):
    __tablename__ = "audios"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_url = Column(Text, nullable=False)
    uploaded_by = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    uploaded_by_user = relationship("User", back_populates="audios")
    tags = relationship(
        "AudioTag", back_populates="audio", cascade="all, delete-orphan"
    )
    likes = relationship("Like", back_populates="audio", cascade="all, delete-orphan")
    favorites = relationship(
        "Favorite", back_populates="audio", cascade="all, delete-orphan"
    )
    last_played = relationship(
        "LastPlayed", back_populates="audio", cascade="all, delete-orphan"
    )
    streams = relationship("Stream", back_populates="audio")


# Table: Tags
class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

    audios = relationship(
        "AudioTag", back_populates="tag", cascade="all, delete-orphan"
    )


# Table: Audio_Tags
class AudioTag(Base):
    __tablename__ = "audio_tags"

    id = Column(Integer, primary_key=True)
    audio_id = Column(
        Integer, ForeignKey("audios.id", ondelete="CASCADE"), nullable=False
    )
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    audio = relationship("Audio", back_populates="tags")
    tag = relationship("Tag", back_populates="audios")

    __table_args__ = (UniqueConstraint("audio_id", "tag_id", name="_audio_tag_uc"),)


# Table: Likes
class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True)
    audio_id = Column(
        Integer, ForeignKey("audios.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    audio = relationship("Audio", back_populates="likes")
    user = relationship("User", back_populates="likes")

    __table_args__ = (UniqueConstraint("audio_id", "user_id", name="_like_uc"),)


# Table: Favorites
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    audio_id = Column(
        Integer, ForeignKey("audios.id", ondelete="CASCADE"), nullable=False
    )
    added_at = Column(TIMESTAMP, server_default=func.now())

    audio = relationship("Audio", back_populates="favorites")
    user = relationship("User", back_populates="favorites")

    __table_args__ = (UniqueConstraint("user_id", "audio_id", name="_favorite_uc"),)


# Table: Last_Played
class LastPlayed(Base):
    __tablename__ = "last_played"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    audio_id = Column(
        Integer, ForeignKey("audios.id", ondelete="CASCADE"), nullable=False
    )
    last_played_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    audio = relationship("Audio", back_populates="last_played")
    user = relationship("User", back_populates="last_played")

    __table_args__ = (UniqueConstraint("user_id", "audio_id", name="_last_played_uc"),)


# Table: Streams
class Stream(Base):
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True)
    audio_id = Column(
        Integer, ForeignKey("audios.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    streamed_at = Column(TIMESTAMP, server_default=func.now())

    audio = relationship("Audio", back_populates="streams")
    user = relationship("User", back_populates="streams")
