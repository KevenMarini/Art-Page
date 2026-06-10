import { NextResponse } from 'next/server';
import { getCategories, addCategory, deleteCategory, updateCategoryName } from '@/lib/db';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    await addCategory(name.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    
    if (!idStr) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, oldName, newName } = await request.json();
    if (!id || !oldName || !newName || newName.trim() === '') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    await updateCategoryName(id, oldName, newName.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}
