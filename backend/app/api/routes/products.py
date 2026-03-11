from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import Product
from app.schemas.schemas import ProductOut, ProductCreate

router = APIRouter()


@router.get("/", response_model=List[ProductOut])
async def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True)
    if category and category != "All":
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(Product.id))
    return result.scalars().all()


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product.category).distinct())
    return {"categories": ["All"] + [r[0] for r in result.all()]}


# ── CRITICAL: Admin routes MUST be registered BEFORE /{product_id}
#    Otherwise FastAPI matches "admin" as an integer product_id → 422 error
@router.get("/admin/all", response_model=List[ProductOut])
async def admin_list_all_products(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    result = await db.execute(select(Product).order_by(Product.id))
    return result.scalars().all()


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(product, k, v)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False  # soft delete
    await db.commit()


# ── Parameterized route LAST to avoid swallowing static paths
@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
