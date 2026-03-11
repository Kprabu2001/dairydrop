from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Notification, NotifType
from app.models.user import SupportTicket
from app.schemas.schemas import SupportTicketCreate, SupportTicketOut, SupportTicketReply

router = APIRouter()


# ── User: Submit a ticket ────────────────────────────────────
@router.post("/", response_model=SupportTicketOut, status_code=201)
async def create_ticket(
    payload: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=payload.subject,
        message=payload.message,
        order_id=payload.order_id,
    )
    db.add(ticket)
    db.add(Notification(
        user_id=current_user.id,
        type=NotifType.system,
        icon="🎫",
        title="Support Ticket Submitted",
        body=f"We received your request: '{payload.subject}'. We'll respond soon!",
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket


# ── User: List their tickets ─────────────────────────────────
@router.get("/", response_model=List[SupportTicketOut])
async def list_my_tickets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.id)
        .order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()


# ── User: Get single ticket ──────────────────────────────────
@router.get("/{ticket_id}", response_model=SupportTicketOut)
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == current_user.id
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


# ── Admin: List all tickets ──────────────────────────────────
@router.get("/admin/all", response_model=List[SupportTicketOut])
async def admin_list_tickets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(
        select(SupportTicket).order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()


# ── Admin: Reply to ticket ───────────────────────────────────
@router.patch("/admin/{ticket_id}/reply", response_model=SupportTicketOut)
async def admin_reply_ticket(
    ticket_id: int,
    payload: SupportTicketReply,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.admin_reply = payload.reply
    if payload.status:
        ticket.status = payload.status

    db.add(Notification(
        user_id=ticket.user_id,
        type=NotifType.system,
        icon="💬",
        title="Support Reply",
        body=f"Your ticket '{ticket.subject}' has been updated. Check your support inbox.",
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket
