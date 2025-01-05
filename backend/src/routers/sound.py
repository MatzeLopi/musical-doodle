from pathlib import Path
from time import sleep
import wave
from uuid import uuid4
from fastapi import Request, HTTPException, Response
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
import numpy as np
import aiofiles

router = APIRouter(prefix="/sound", tags=["sound"])


def stream_chunks(file_path: Path):
    with open(file_path, "rb") as file:
        i = 0
        while i < 1000:
            chunk = file.read(1024)
            if not chunk:
                break
            yield chunk


@router.get("/")
async def get_sound():
    return {"message": "Sound Router"}


@router.get("/tracks")
async def get_tracks():
    track_list: list = [{"file_name": "test_audio.wav"}]
    return track_list


@router.get("/stream")
async def stream_audio(file_name: str):
    file_path = Path(
        "/home/matthias/WS_all/AudioDeamon/backend/audio_files/test_audio.wav"
    )
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return StreamingResponse(stream_chunks(file_path), media_type="audio/wav")
