# Built-in modules
import logging
from typing import Annotated
from datetime import timedelta

# Third-party modules
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Custom modules
from backend.constants import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.dependencies import (
    get_db,
    authenticate_user,
    create_access_token,
    Token,
)

# Routers
from routers.sound import router as sound_router
from routers.users import router as user_router

app = FastAPI()

app.include_router(sound_router)
app.include_router(user_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-duration", "X-Title"],
)


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> Token:
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@app.get("/")
def root():
    return "Hello World"


@app.get("/user/{user_id}")
def test(user_id: int):
    return {"user_id": user_id}
