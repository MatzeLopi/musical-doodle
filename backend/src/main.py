from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.sound import router as sound_router

app = FastAPI()

app.include_router(sound_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-duration"],
)


@app.get("/")
def root():
    return "Hello World"


@app.get("/user/{user_id}")
def test(user_id: int):
    return {"user_id": user_id}
