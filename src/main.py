from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from routers.sound import router as sound_router

app = FastAPI()

app.include_router(sound_router)
app.mount(
    "/static",
    StaticFiles(directory="/home/matthias/WS_all/AudioDeamon/static"),
    name="static",
)


@app.get("/")
def root():
    return HTMLResponse(Path("static/index.html").read_text())
