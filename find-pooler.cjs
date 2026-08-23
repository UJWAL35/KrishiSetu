const postgres = require('postgres');

const regions = [
  'ap-south-1', 'us-east-1', 'us-west-1', 'us-west-2', 'eu-central-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ca-central-1', 'sa-east-1'
];

async function check() {
  for (const region of regions) {
    const url = `postgresql://postgres.lvybesdevgflafnoklcn:ujwalsupabase%402005@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const sql = postgres(url, { connect_timeout: 3 });
    try {
      const res = await sql`SELECT 1 as val`;
      console.log(`Success on region: ${region}`);
      await sql.end();
      return region;
    } catch (e) {
      console.log(`Failed on ${region}:`, e.message);
    }
    await sql.end().catch(()=>{});
  }
}
check();
