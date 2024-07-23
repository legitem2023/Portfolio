
import prisma from '../../../lib/prisma';
export async function GET(request) {
  try {
    const skills = await prisma.projects.findMany();
    return new Response(JSON.stringify(skills), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch skills' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
