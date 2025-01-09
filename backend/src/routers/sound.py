import logging
import aiofiles
import os
import wave
from typing import Optional
from pathlib import Path
from fastapi import HTTPException, Response, Request
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sound", tags=["sound"])


def _get_audio_duration(file_path: Path) -> float:
    """Get the duration of a WAV file in seconds."""
    assert isinstance(file_path, Path), "Expected a Path object for file_path"

    with wave.open(str(file_path), "rb") as audio_file:
        frames = audio_file.getnframes()
        rate = audio_file.getframerate()
        duration = frames / float(rate)
    return duration


async def _stream_chunks(file_path: Path, start: Optional[int] = 0):
    assert isinstance(file_path, Path), "Expected a Path object for file_path"

    async with aiofiles.open(file_path, "rb") as file:
        await file.seek(start)
        while chunk := await file.read(1024 * 10):
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


@router.head("/stream")
@router.get("/stream")
async def stream_audio(file_name: str, request: Request):
    file_path = Path(
        f"/home/matthias/WS_all/AudioDeamon/backend/audio_files/test_audio.wav"
    )
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")
    start = 0
    end = file_size - 1

    if range_header:
        # Parse the range header
        ranges = range_header.replace("bytes=", "").split("-")
        start = int(ranges[0]) if ranges[0] else start
        end = int(ranges[1]) if len(ranges) > 1 and ranges[1] else end

        # Ensure start and end are within bounds
        start = max(0, start)
        end = min(file_size - 1, end)

        if start > end:
            raise HTTPException(
                status_code=416, detail="Requested Range Not Satisfiable"
            )

    # Determine content length and headers
    content_length = end - start + 1
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": "audio/wav",
        "X-Total-Duration": str(_get_audio_duration(file_path)),
    }

    return StreamingResponse(
        _stream_chunks(file_path=file_path, start=start),
        headers=headers,
        status_code=206 if range_header else 200,
    )


@router.get("/metadata")
def get_info(file_name: str):
    """Return the length of the audio file in seconds"""
    file_name = Path(
        "/home/matthias/WS_all/AudioDeamon/backend/audio_files/test_audio.wav"
    )
    if not file_name.exists():
        raise HTTPException(status_code=404, detail="File not found")
    with wave.open(str(file_name), "rb") as file:
        return {"duration": file.getnframes() / file.getframerate()}
