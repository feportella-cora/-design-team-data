import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const files = [
  'data/access-control.json',
  'data/time-off-2026.json',
  'data/ai-assessment-questions.json',
  'data/ai-assessment-submissions.json',
  'schemas/ai-assessment-submission.schema.json'
];

for (const file of files) JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

const access = JSON.parse(fs.readFileSync(path.join(root, 'data/access-control.json')));
const timeOff = JSON.parse(fs.readFileSync(path.join(root, 'data/time-off-2026.json')));
const invalidDates = [];
const outOfYearDates = [];
const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

for (const person of timeOff.people) {
  for (const kind of ['vacationDates', 'leaveDates']) {
    for (const raw of person[kind]) {
      const match = raw.match(datePattern);
      if (!match) invalidDates.push(`${person.name}: ${raw}`);
      else {
        const date = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00Z`);
        if (date.getUTCFullYear() !== Number(match[3]) || date.getUTCMonth() + 1 !== Number(match[2]) || date.getUTCDate() !== Number(match[1])) invalidDates.push(`${person.name}: ${raw}`);
        else if (date.getUTCFullYear() !== timeOff.year) outOfYearDates.push(`${person.name}: ${raw}`);
      }
    }
  }
}

if (access.people.length === 0 || timeOff.people.length === 0) throw new Error('Dados principais vazios');
console.log(`OK: ${access.people.length} pessoas com acesso; ${timeOff.people.length} pessoas no calendário.`);
if (invalidDates.length) console.warn(`ATENÇÃO: ${invalidDates.length} datas de origem inválidas preservadas: ${invalidDates.join(', ')}`);
if (outOfYearDates.length) console.warn(`ATENÇÃO: ${outOfYearDates.length} datas fora de 2026 preservadas: ${outOfYearDates.join(', ')}`);
