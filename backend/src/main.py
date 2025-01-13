# Built-in modules
import logging
from typing import Annotated
from datetime import timedelta

# Third-party modules
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse, Response
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
    validate_csrf_token,
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


@app.get("/csrf-token")
def get_csrf_token(response: Response):
    csrf_token = "TOKEN"  # Generate a random token
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,  # Prevent JavaScript access
        secure=True,  # Use HTTPS in production
        samesite="Strict",
    )
    return {"csrf_token": csrf_token}


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    await validate_csrf_token(request)
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

    response = JSONResponse({"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,  # Use HTTPS in production
        samesite="strict",
    )
    return response


@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token", httponly=True, samesite="Strict", secure=True
    )
    return {"message": "Logged out successfully"}


@app.get("/")
def root():
    return {"status": "running"}
