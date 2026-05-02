import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch all entries, sorted by date descending
    const entries = await DailyEntry.find({}).sort({ date: -1 });

    let markdown = `# Noto - Personal Diary Export\n\n`;
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    entries.forEach((entry) => {
      // Only include entries that have some content
      if (!entry.highlight && !entry.kadai && !entry.activities && entry.customColumns.length === 0) {
        return;
      }

      markdown += `## Date: ${entry.date}\n`;
      markdown += `**Happiness Level:** ${entry.happiness || '-'}/10\n\n`;

      const strip = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';

      if (entry.highlight) {
        markdown += `### Highlight\n${strip(entry.highlight)}\n\n`;
      }
      if (entry.kadai) {
        markdown += `### Kadai & Issues\n${strip(entry.kadai)}\n\n`;
      }
      if (entry.activities) {
        markdown += `### Daily Log\n${strip(entry.activities)}\n\n`;
      }

      if (entry.customColumns && entry.customColumns.length > 0) {
        entry.customColumns.forEach((col: any) => {
          if (col.content) {
            markdown += `### ${col.category}\n${strip(col.content)}\n\n`;
          }
        });
      }

      markdown += `---\n\n`;
    });

    const response = new NextResponse(markdown);
    response.headers.set('Content-Type', 'text/markdown');
    response.headers.set('Content-Disposition', `attachment; filename="Noto_Export_${new Date().toISOString().split('T')[0]}.md"`);

    return response;
  } catch (error) {
    console.error('Error exporting diary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
