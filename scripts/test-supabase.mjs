import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { randomBytes, randomUUID, createHmac } from 'node:crypto'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import console from 'node:console'
const project = 'ferreteria_storefront_integration'
if (
  !readFileSync('supabase/config.toml', 'utf8').includes(
    `project_id = "${project}"`,
  )
)
  throw new Error('Destino local incorrecto')
const raw = execFileSync(
  process.execPath,
  ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 },
)
const status = JSON.parse(raw.slice(raw.indexOf('{')))
if (status.API_URL !== 'http://127.0.0.1:61321')
  throw new Error('URL no autorizada')
const url = status.API_URL,
  key = status.ANON_KEY
const client = (token = key) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
const root = createClient(url, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const results = []
function ok(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`)
  results.push(label)
  console.log(`PASS: ${label}`)
}
function sql(query) {
  return execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_ferreteria_storefront_integration',
      'psql',
      '-X',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      query,
    ],
    { encoding: 'utf8' },
  ).trim()
}
const run = randomUUID().replaceAll('-', '').slice(0, 10)
async function user(name) {
  const email = `${name}.${run}@example.test`,
    password = randomBytes(24).toString('base64url')
  const created = await root.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  })
  if (created.error)
    throw new Error('No se pudo crear identidad local de prueba')
  const sessionClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const login = await sessionClient.auth.signInWithPassword({ email, password })
  if (login.error)
    throw new Error(
      'Auth login: ' +
        login.error.code +
        ' / ' +
        login.error.status +
        ' / ' +
        login.error.message,
    )
  return {
    id: created.data.user.id,
    email,
    password,
    token: login.data.session.access_token,
    client: sessionClient,
  }
}
const admin = await user('admin'),
  operator = await user('operador'),
  customer = await user('cliente'),
  other = await user('otro')
const anon = client()
sql(
  `insert into public.staff_roles(user_id,role) values('${admin.id}','admin'),('${operator.id}','operator')`,
)
ok(
  (await admin.client.auth.getUser()).data.user?.id === admin.id,
  'Auth login real y JWT verificado',
)
ok(
  (
    await admin.client.auth.signInWithPassword({
      email: admin.email,
      password: randomUUID(),
    })
  ).error !== null,
  'Contraseña inválida rechazada',
)
// Restaurar explícitamente el login correcto.
await admin.client.auth.signInWithPassword({
  email: admin.email,
  password: admin.password,
})
const signedIn = await admin.client.auth.getSession()
ok(Boolean(signedIn.data.session), 'Sesión disponible')
const r = await anon.from('categories').select('id')
ok(!r.error && r.data.length > 0, 'Anónimo lee categorías públicas')
ok(
  !(await anon.from('products').select('id')).error,
  'Anónimo lee productos publicados',
)
for (const table of ['receipt_item_costs', 'inventory_balances', 'orders'])
  ok(
    Boolean((await anon.from(table).select('*')).error),
    `Anónimo bloqueado en ${table}`,
  )
const product = 'a2000000-0000-0000-0000-000000000001',
  presentation = 'a3000000-0000-0000-0000-000000000001'
ok(
  Boolean(
    (
      await anon.from('products').insert({
        sku: `ANON-${run}`,
        name: 'No',
        category_id: 'a1000000-0000-0000-0000-000000000001',
        base_unit: 'unidad',
      })
    ).error,
  ),
  'Anónimo no crea producto',
)
ok(
  Boolean(
    (
      await customer.client.from('volume_prices').insert({
        presentation_id: presentation,
        min_quantity: 100,
        price_clp: 1,
        valid_from: new Date().toISOString(),
        active: true,
      })
    ).error,
  ),
  'Cliente no escribe precios',
)
ok(
  Boolean(
    (
      await customer.client
        .from('inventory_balances')
        .update({ physical: 999 })
        .eq('product_id', product)
    ).error,
  ),
  'Cliente no escribe saldo',
)
ok(
  Boolean(
    (
      await customer.client
        .from('staff_roles')
        .insert({ user_id: customer.id, role: 'admin' })
    ).error,
  ),
  'Cliente no se asigna rol',
)
ok(
  (await customer.client.from('staff_roles').select('*')).data?.length === 0,
  'Metadata admin no concede rol',
)
ok(
  Boolean(
    (
      await operator.client.rpc('set_staff_role', {
        target: operator.id,
        new_role: 'admin',
        enabled: true,
      })
    ).error,
  ),
  'Operador no administra roles',
)
ok(
  (await operator.client.from('receipt_item_costs').select('*')).data
    ?.length === 0,
  'Operador no lee costos',
)
ok(
  !(await operator.client.from('inventory_balances').select('*')).error,
  'Operador consulta inventario',
)
const created = await admin.client
  .from('products')
  .insert({
    sku: `HTTP-${run}`,
    name: 'Producto API de prueba',
    category_id: 'a1000000-0000-0000-0000-000000000001',
    base_unit: 'unidad',
    active: false,
  })
  .select()
  .single()
ok(!created.error, 'Administrador crea producto por PostgREST')
ok(
  !(
    await admin.client
      .from('products')
      .update({ name: 'Producto editado', active: true })
      .eq('id', created.data.id)
  ).error,
  'Administrador edita y activa producto',
)
ok(
  !(
    await admin.client.from('volume_prices').insert({
      presentation_id: presentation,
      min_quantity: 1000 + Math.floor(Math.random() * 100000000),
      price_clp: 59000,
      valid_from: new Date().toISOString(),
      active: true,
    })
  ).error,
  'Administrador administra precios',
)
const supplier = sql(
  `insert into public.suppliers(name) values('Proveedor HTTP ${run}') returning id`,
).split('\n')[0]
const receipt = await operator.client.rpc('create_receipt', {
  supplier,
  reference: `HTTP-${run}`,
  lines: [{ presentation_id: presentation, quantity: 20 }],
  request: randomUUID(),
})
ok(!receipt.error, 'Operador registra borrador por RPC')
ok(
  Boolean(
    (await operator.client.rpc('confirm_receipt', { receipt: receipt.data }))
      .error,
  ),
  'Operador no confirma recepción',
)
ok(
  !(await admin.client.rpc('confirm_receipt', { receipt: receipt.data })).error,
  'Administrador confirma recepción',
)
const order = await customer.client.rpc('create_order', {
  lines: [{ presentation_id: presentation, quantity: 1 }],
  request: randomUUID(),
})
ok(!order.error, 'Cliente crea pedido autorizado para prueba RPC')
ok(
  (await other.client.from('orders').select('*').eq('id', order.data)).data
    ?.length === 0,
  'JWT de otro cliente oculta pedido ajeno',
)
ok(
  (
    await other.client
      .from('order_items')
      .select('*,orders(*)')
      .eq('order_id', order.data)
  ).data?.length === 0,
  'Join no filtra detalles privados',
)
ok(
  Boolean(
    (
      await customer.client.rpc('process_payment_event', {
        oid: order.data,
        provider_name: 'webpay',
        payment_ref: 'no',
        event_ref: 'no',
        amount: 69990,
        target_state: 'approved',
      })
    ).error,
  ),
  'Navegador no ejecuta RPC de pagos',
)
ok(
  Boolean((await anon.rpc('confirm_receipt', { receipt: receipt.data })).error),
  'Anónimo no ejecuta RPC privilegiada',
)
ok(
  Boolean(
    (
      await customer.client
        .from('profiles')
        .update({ created_at: new Date().toISOString() })
        .eq('id', customer.id)
    ).error,
  ),
  'Columna de perfil restringida',
)
const invalid = await globalThis.fetch(`${url}/rest/v1/products`, {
  headers: { apikey: key, Authorization: 'Bearer invalid' },
})
ok(invalid.status === 401, 'Token inválido rechazado por endpoint real')
const enc = (x) => Buffer.from(JSON.stringify(x)).toString('base64url')
const prefix =
  enc({ alg: 'HS256', typ: 'JWT' }) +
  '.' +
  enc({
    sub: customer.id,
    role: 'authenticated',
    aud: 'authenticated',
    iss: 'supabase-demo',
    iat: 1,
    exp: 2,
  })
const expired =
  prefix +
  '.' +
  createHmac('sha256', status.JWT_SECRET).update(prefix).digest('base64url')
const response = await globalThis.fetch(`${url}/rest/v1/products`, {
  headers: { apikey: key, Authorization: `Bearer ${expired}` },
})
ok(response.status === 401, 'Token expirado rechazado por endpoint real')
const changed = await admin.client.rpc('set_staff_role', {
  target: operator.id,
  new_role: 'operator',
  enabled: false,
})
ok(!changed.error, 'Administrador revoca rol')
ok(
  (await operator.client.from('inventory_balances').select('*')).data
    ?.length === 0,
  'Revocación efectiva con el mismo JWT',
)
await admin.client.rpc('set_staff_role', {
  target: operator.id,
  new_role: 'operator',
  enabled: true,
})
const bytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhAAAAABJRU5ErkJggg==',
    'base64',
  ),
  path = `${product}/${run}.png`
ok(
  Boolean(
    (
      await anon.storage
        .from('ferreteria-product-images')
        .upload(`anon-${run}.png`, bytes, { contentType: 'image/png' })
    ).error,
  ),
  'Storage rechaza carga anónima',
)
ok(
  Boolean(
    (
      await admin.client.storage
        .from('ferreteria-product-images')
        .upload(`bad-${run}.txt`, Buffer.from('no'), {
          contentType: 'text/plain',
        })
    ).error,
  ),
  'Storage rechaza MIME arbitrario',
)
ok(
  Boolean(
    (
      await admin.client.storage
        .from('ferreteria-product-images')
        .upload(`big-${run}.png`, Buffer.alloc(5 * 1024 * 1024 + 1), {
          contentType: 'image/png',
        })
    ).error,
  ),
  'Storage rechaza imagen mayor a 5 MB',
)
ok(
  !(
    await admin.client.storage
      .from('ferreteria-product-images')
      .upload(path, bytes, { contentType: 'image/png' })
  ).error,
  'Administrador sube PNG autorizado',
)
const image = await admin.client
  .from('product_images')
  .insert({
    product_id: product,
    storage_path: path,
    alt_text: 'Imagen ficticia de pruebas',
    approved: false,
  })
  .select()
  .single()
ok(!image.error, 'Imagen asociada como borrador')
ok(
  Boolean(
    (
      await anon.storage
        .from('ferreteria-product-images')
        .createSignedUrl(path, 60)
    ).error,
  ),
  'Borrador no obtiene URL firmada anónima',
)
await admin.client
  .from('product_images')
  .update({ approved: true })
  .eq('id', image.data.id)
const approved = await anon.storage
  .from('ferreteria-product-images')
  .createSignedUrl(path, 60)
ok(!approved.error, 'Imagen aprobada obtiene URL firmada')
ok(
  (await globalThis.fetch(approved.data.signedUrl)).ok,
  'Archivo aprobado se descarga por Storage real',
)
const publicUrl = anon.storage
  .from('ferreteria-product-images')
  .getPublicUrl(path).data.publicUrl
ok(
  !(await globalThis.fetch(publicUrl)).ok,
  'Bucket privado impide URL pública irrestricta',
)
// Eliminar aprobación invalida nuevos accesos; URL ya firmada tiene TTL, como documentado.
await admin.client
  .from('product_images')
  .update({ approved: false })
  .eq('id', image.data.id)
ok(
  Boolean(
    (
      await anon.storage
        .from('ferreteria-product-images')
        .createSignedUrl(path, 60)
    ).error,
  ),
  'Desaprobación bloquea nuevas URLs',
)
await admin.client
  .from('product_images')
  .update({ approved: true })
  .eq('id', image.data.id)
const signing = client(customer.token)
ok(
  (await signing.auth.getUser(customer.token)).data.user?.id === customer.id,
  'JWT conserva identidad real',
)
await customer.client.auth.signOut()
ok(
  !(await customer.client.auth.getSession()).data.session,
  'Logout elimina sesión del cliente',
)
// Contratos del storefront: sólo información comercial y cotización sin mutaciones.
const availability = await anon.rpc('storefront_availability')
ok(
  !availability.error &&
    availability.data.some((x) => x.product_id === product),
  'Anónimo consulta disponibilidad comercial',
)
ok(
  availability.data.every(
    (x) => Object.keys(x).sort().join(',') === 'available,product_id',
  ),
  'Disponibilidad no expone físico, reservas, costos ni roles',
)
const beforeQuote = sql('select count(*) from public.orders')
const serverQuote = await anon.rpc('storefront_quote', {
  lines: [{ presentation_id: presentation, quantity: 2, price_clp: 1 }],
})
ok(
  !serverQuote.error && serverQuote.data.total_clp === 139980,
  'Servidor ignora precio manipulado y aplica precio vigente',
)
ok(
  serverQuote.data.lines[0].units === 2 &&
    serverQuote.data.checkout_enabled === false,
  'Contrato conserva equivalencias sin habilitar checkout',
)
ok(
  sql('select count(*) from public.orders') === beforeQuote,
  'Cotizar no genera pedidos ni reservas',
)
for (const quantity of [0, -1, 1.5, 1000000000])
  ok(
    Boolean(
      (
        await anon.rpc('storefront_quote', {
          lines: [{ presentation_id: presentation, quantity }],
        })
      ).error,
    ),
    'Cotizador rechaza cantidad inválida ' + quantity,
  )
ok(
  Boolean((await anon.rpc('storefront_quote', { lines: [] })).error),
  'Cotizador rechaza carrito vacío',
)
ok(
  Boolean(
    (
      await anon.rpc('storefront_quote', {
        lines: [{ presentation_id: presentation, quantity: 100 }],
      })
    ).error,
  ),
  'Cotizador rechaza sobrestock',
)
ok(
  Boolean(
    (
      await anon.rpc('storefront_quote', {
        lines: [
          {
            presentation_id: presentation,
            quantity:
              Math.floor(
                availability.data.find((x) => x.product_id === product)
                  .available / 2,
              ) + 1,
          },
          {
            presentation_id: presentation,
            quantity:
              Math.floor(
                availability.data.find((x) => x.product_id === product)
                  .available / 2,
              ) + 1,
          },
        ],
      })
    ).error,
  ),
  'Cotizador acumula disponibilidad del producto entre líneas',
)
ok(
  Boolean(
    (
      await operator.client.from('products').insert({
        sku: 'DENIED-' + run,
        name: 'No',
        category_id: 'a1000000-0000-0000-0000-000000000001',
        base_unit: 'unidad',
      })
    ).error,
  ),
  'Operador no modifica catálogo',
)
const parent = await admin.client
  .from('categories')
  .insert({ name: 'Padre oculto ' + run, slug: 'hidden-' + run, active: false })
  .select()
  .single()
const child = await admin.client
  .from('categories')
  .insert({
    name: 'Hijo activo ' + run,
    slug: 'child-' + run,
    parent_id: parent.data.id,
    active: true,
  })
  .select()
  .single()
const hidden = await admin.client
  .from('products')
  .insert({
    sku: 'HIDDEN-' + run,
    name: 'Oculto',
    category_id: child.data.id,
    base_unit: 'unidad',
    active: true,
  })
  .select()
  .single()
ok(
  (await anon.from('categories').select('id').eq('id', child.data.id)).data
    ?.length === 0,
  'RLS oculta descendientes de categorías inactivas',
)
ok(
  (await anon.from('products').select('id').eq('id', hidden.data.id)).data
    ?.length === 0,
  'RLS oculta productos bajo ancestros inactivos',
)
ok(
  !(await anon.rpc('storefront_availability')).data.some(
    (x) => x.product_id === hidden.data.id,
  ),
  'Disponibilidad respeta publicación jerárquica',
)
const inactivePresentation = await admin.client
  .from('presentations')
  .insert({
    product_id: product,
    kind: 'box',
    label: 'Caja inactiva',
    base_units: 2,
    active: false,
  })
  .select()
  .single()
ok(
  Boolean(
    (
      await anon.rpc('storefront_quote', {
        lines: [{ presentation_id: inactivePresentation.data.id, quantity: 1 }],
      })
    ).error,
  ),
  'Cotizador rechaza presentación inactiva',
)
const noPrice = await admin.client
  .from('presentations')
  .insert({
    product_id: product,
    kind: 'package',
    label: 'Embalaje sin precio',
    base_units: 3,
    active: true,
  })
  .select()
  .single()
ok(
  Boolean(
    (
      await anon.rpc('storefront_quote', {
        lines: [{ presentation_id: noPrice.data.id, quantity: 1 }],
      })
    ).error,
  ),
  'Cotizador rechaza presentación sin precio vigente',
)
// Cuenta de pruebas efímera para QA visual; contraseña aleatoria, archivo privado ignorado; eliminarlo al terminar la revisión local.
mkdirSync('.local', { recursive: true })
writeFileSync(
  '.local/ui-auth.json',
  JSON.stringify({ email: admin.email, password: admin.password }),
)
writeFileSync(
  'docs/supabase-test-results.txt',
  results.map((x) => `PASS: ${x}`).join('\n') +
    `\n${results.length} pruebas reales aprobadas.\n`,
)
console.log(
  `${results.length} comprobaciones Supabase aprobadas; no se mostraron credenciales.`,
)
