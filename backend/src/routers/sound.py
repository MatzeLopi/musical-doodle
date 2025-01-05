import aiofiles
import os
import wave
from typing import Optional
from pathlib import Path
from fastapi import HTTPException, Response
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/sound", tags=["sound"])


async def stream_chunks(file_path: Path):
    async with aiofiles.open(file_path, "rb") as file:
        i = 0
        while i < 1000:
            chunk = await file.read(1024)
            if not chunk:
                break
            yield chunk


@router.get("/")
async def get_sound():
    return {"message": "Sound Router"}


@router.get("/tracks")
async def get_tracks():
    track_list: list = os.listdir(
        "/home/matthias/WS_all/AudioDeamon/backend/audio_files"
    )
    return track_list


@router.get("/stream")
async def stream_audio(file_name: str):
    file_name = Path(
        "/home/matthias/WS_all/AudioDeamon/backend/audio_files/test_audio.wav"
    )
    if not file_name.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return StreamingResponse(stream_chunks(file_name), media_type="audio/wav")


@router.get("/info")
def get_info(file_name: str):
    """Return the length of the audio file in seconds"""
    file_name = Path(
        "/home/matthias/WS_all/AudioDeamon/backend/audio_files/test_audio.wav"
    )
    if not file_name.exists():
        raise HTTPException(status_code=404, detail="File not found")
    with wave.open(str(file_name), "rb") as file:
        return {"duration": file.getnframes() / file.getframerate()}
