import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const dbData = JSON.parse(fs.readFileSync('db.json', 'utf8'));

  console.log('Migrating products...');
  if (dbData.products && dbData.products.length > 0) {
    const { error } = await supabase.from('products').upsert(dbData.products);
    if (error) console.error('Error products:', error);
    else console.log('Products migrated!');
  }

  console.log('Migrating prints...');
  if (dbData.prints && dbData.prints.length > 0) {
    const { error } = await supabase.from('prints').upsert(dbData.prints);
    if (error) console.error('Error prints:', error);
    else console.log('Prints migrated!');
  }

  console.log('Migrating siteImages...');
  if (dbData.siteImages && dbData.siteImages.length > 0) {
    const { error } = await supabase.from('siteImages').upsert(dbData.siteImages);
    if (error) console.error('Error siteImages:', error);
    else console.log('siteImages migrated!');
  }

  console.log('Migrating siteTexts...');
  if (dbData.siteTexts && dbData.siteTexts.length > 0) {
    const { error } = await supabase.from('siteTexts').upsert(dbData.siteTexts);
    if (error) console.error('Error siteTexts:', error);
    else console.log('siteTexts migrated!');
  }

  console.log('Migration complete!');
}

migrate();
