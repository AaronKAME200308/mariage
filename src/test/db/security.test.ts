// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite'
import { anon, as, createDb, user } from './harness'

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  coupleA: '00000000-0000-4000-8000-000000000002',
  coupleB: '00000000-0000-4000-8000-000000000003',
  hostessA: '00000000-0000-4000-8000-000000000004',
  hostessFree: '00000000-0000-4000-8000-000000000005',
  wedA: '10000000-0000-4000-8000-000000000001',
  wedB: '10000000-0000-4000-8000-000000000002',
  wedDraft: '10000000-0000-4000-8000-000000000003',
  tableA1: '20000000-0000-4000-8000-000000000001', // capacité 4
  tableA2: '20000000-0000-4000-8000-000000000002', // capacité 2
  tableB1: '20000000-0000-4000-8000-000000000003',
  alice: '30000000-0000-4000-8000-000000000001', // A, +1, table A1, contact connu
  bob: '30000000-0000-4000-8000-000000000002', // A, +0, table A1
  dan: '30000000-0000-4000-8000-000000000003', // A, refusé
  carl: '30000000-0000-4000-8000-000000000004', // A, +3
  erin: '30000000-0000-4000-8000-000000000005', // A, +0 (scénarios de scan)
  frank: '30000000-0000-4000-8000-000000000006', // A, +0 (annulation)
  henri: '30000000-0000-4000-8000-000000000007', // B
}

let db: PGlite

async function token(guestId: string): Promise<string> {
  const { rows } = await db.query<{ token: string }>(
    `select token from public.guest_qr_tokens where guest_id = $1 and status = 'active'`,
    [guestId],
  )
  return rows[0].token
}

async function rpc<T = Record<string, unknown>>(
  actor: Parameters<typeof as>[1],
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  return as(db, actor, async () => {
    const { rows } = await db.query<{ r: T }>(`select ${sql} as r`, params)
    return rows[0].r
  })
}

beforeAll(async () => {
  db = await createDb()
  for (const [id, role] of [
    [ID.admin, 'admin'],
    [ID.coupleA, 'couple'],
    [ID.coupleB, 'couple'],
    [ID.hostessA, 'hostess'],
    [ID.hostessFree, 'hostess'],
  ]) {
    await db.query(
      `insert into auth.users (id, email, raw_app_meta_data) values ($1, $2, $3::jsonb)`,
      [id, `${id}@test.local`, JSON.stringify({ role })],
    )
  }
  await db.exec(`
    insert into public.weddings (id, slug, partner_one_name, partner_two_name, status, wedding_date, settings) values
      ('${ID.wedA}', 'amelieetyoan', 'Amélie', 'Yoan', 'published', now() + interval '30 days',
        '{"rsvp": {"enabled": true}}'),
      ('${ID.wedB}', 'sandraetmichel', 'Sandra', 'Michel', 'published', now() + interval '60 days', '{}'),
      ('${ID.wedDraft}', 'brouillon-2027', 'Test', 'Draft', 'draft', null, '{}');

    insert into public.wedding_memberships (wedding_id, user_id, member_role) values
      ('${ID.wedA}', '${ID.coupleA}', 'couple'),
      ('${ID.wedB}', '${ID.coupleB}', 'couple'),
      ('${ID.wedA}', '${ID.hostessA}', 'hostess');

    insert into public.tables (id, wedding_id, name, capacity) values
      ('${ID.tableA1}', '${ID.wedA}', 'Table 1', 4),
      ('${ID.tableA2}', '${ID.wedA}', 'Table 2', 2),
      ('${ID.tableB1}', '${ID.wedB}', 'Table 1', 10);

    insert into public.guests (id, wedding_id, full_name, email, allowed_companions, table_id, rsvp_status) values
      ('${ID.alice}', '${ID.wedA}', 'Alice Martin', 'alice@example.com', 1, '${ID.tableA1}', 'pending'),
      ('${ID.bob}', '${ID.wedA}', 'Bob Nkoulou', null, 0, '${ID.tableA1}', 'pending'),
      ('${ID.dan}', '${ID.wedA}', 'Dan Refus', null, 0, null, 'declined'),
      ('${ID.carl}', '${ID.wedA}', 'Carl Mbarga', null, 3, null, 'pending'),
      ('${ID.erin}', '${ID.wedA}', 'Erin Test', null, 0, null, 'pending'),
      ('${ID.frank}', '${ID.wedA}', 'Frank Annule', null, 0, null, 'pending'),
      ('${ID.henri}', '${ID.wedB}', 'Henri Autre', null, 0, '${ID.tableB1}', 'pending');

    insert into public.guestbook_messages (wedding_id, author_name, message, status) values
      ('${ID.wedA}', 'Visiteur', 'Message approuvé', 'approved'),
      ('${ID.wedA}', 'Spammeur', 'Message en attente', 'pending');
  `)
}, 60000)

describe('profils et rôles', () => {
  it('prend le rôle dans app_metadata, jamais dans user_metadata', async () => {
    const evil = '00000000-0000-4000-8000-0000000000aa'
    await db.query(
      `insert into auth.users (id, raw_user_meta_data) values ($1, '{"role":"admin"}'::jsonb)`,
      [evil],
    )
    const { rows } = await db.query<{ role: string }>(`select role::text from public.profiles where id = $1`, [evil])
    expect(rows[0].role).toBe('couple')
  })

  it('refuse qu’un utilisateur s’attribue le rôle admin', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`update public.profiles set role = 'admin' where id = $1`, [ID.coupleA]),
      ),
    ).rejects.toThrow(/forbidden_profile_change/)
  })

  it('refuse qu’un utilisateur réactive ou désactive son propre compte', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`update public.profiles set is_active = false where id = $1`, [ID.coupleA]),
      ),
    ).rejects.toThrow(/forbidden_profile_change/)
  })

  it('une membership doit correspondre au rôle du profil', async () => {
    await expect(
      db.query(
        `insert into public.wedding_memberships (wedding_id, user_id, member_role) values ($1, $2, 'couple')`,
        [ID.wedB, ID.hostessFree],
      ),
    ).rejects.toThrow(/membership_role_mismatch/)
  })
})

describe('isolation entre mariages', () => {
  it('un couple ne voit pas les invités d’un autre mariage', async () => {
    const rows = await as(db, user(ID.coupleA), async () =>
      (await db.query<{ id: string }>(`select id from public.guests`)).rows,
    )
    const ids = rows.map((r) => r.id)
    expect(ids).toContain(ID.alice)
    expect(ids).not.toContain(ID.henri)
  })

  it('un couple ne peut pas créer d’invité dans le mariage d’un autre', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`insert into public.guests (wedding_id, full_name) values ($1, 'Intrus')`, [ID.wedB]),
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('un couple ne peut pas modifier le mariage d’un autre (0 ligne affectée)', async () => {
    const res = await as(db, user(ID.coupleA), () =>
      db.query(`update public.weddings set partner_one_name = 'Hack' where id = $1`, [ID.wedB]),
    )
    expect(res.affectedRows).toBe(0)
  })

  it('un couple ne peut pas se donner accès à un autre mariage', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(
          `insert into public.wedding_memberships (wedding_id, user_id, member_role) values ($1, $2, 'couple')`,
          [ID.wedB, ID.coupleA],
        ),
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('un couple ne peut pas changer le slug ni le statut de son site', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`update public.weddings set status = 'archived' where id = $1`, [ID.wedA]),
      ),
    ).rejects.toThrow(/forbidden_wedding_change/)
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`update public.weddings set slug = 'vole' where id = $1`, [ID.wedA]),
      ),
    ).rejects.toThrow(/forbidden_wedding_change/)
  })

  it('un couple peut personnaliser son propre site', async () => {
    const res = await as(db, user(ID.coupleA), () =>
      db.query(`update public.weddings set theme = '{"primary":"#183D32"}' where id = $1`, [ID.wedA]),
    )
    expect(res.affectedRows).toBe(1)
  })

  it('le slug respecte le format et la liste réservée', async () => {
    await expect(
      db.query(`insert into public.weddings (slug, partner_one_name, partner_two_name) values ('Admin', 'a', 'b')`),
    ).rejects.toThrow(/weddings_slug_format/)
    await expect(
      db.query(`insert into public.weddings (slug, partner_one_name, partner_two_name) values ('login', 'a', 'b')`),
    ).rejects.toThrow(/weddings_slug_not_reserved/)
  })

  it('l’admin voit tous les mariages', async () => {
    const rows = await as(db, user(ID.admin), async () =>
      (await db.query(`select id from public.weddings`)).rows,
    )
    expect(rows).toHaveLength(3)
  })
})

describe('hôtesses', () => {
  it('ne lisent aucun invité, QR ni historique directement', async () => {
    const counts = await as(db, user(ID.hostessA), async () => ({
      guests: (await db.query(`select 1 from public.guests`)).rows.length,
      tokens: (await db.query(`select 1 from public.guest_qr_tokens`)).rows.length,
      checkIns: (await db.query(`select 1 from public.check_ins`)).rows.length,
    }))
    expect(counts).toEqual({ guests: 0, tokens: 0, checkIns: 0 })
  })

  it('ne peuvent modifier ni invités, ni tables, ni mariages', async () => {
    const results = await as(db, user(ID.hostessA), async () => [
      await db.query(`update public.guests set full_name = 'X' where id = $1`, [ID.alice]),
      await db.query(`update public.tables set capacity = 99 where id = $1`, [ID.tableA1]),
      await db.query(`update public.weddings set partner_one_name = 'X' where id = $1`, [ID.wedA]),
    ])
    expect(results.map((r) => r.affectedRows)).toEqual([0, 0, 0])
  })

  it('ne voient que le mariage qui leur est attribué', async () => {
    const rows = await as(db, user(ID.hostessA), async () =>
      (await db.query<{ id: string }>(`select id from public.weddings`)).rows,
    )
    expect(rows.map((r) => r.id)).toEqual([ID.wedA])
  })
})

describe('visiteurs anonymes', () => {
  it.each(['guests', 'guest_qr_tokens', 'check_ins', 'weddings', 'audit_logs', 'rsvp_responses', 'contact_messages'])(
    'ne peuvent pas lire %s',
    async (table) => {
      await expect(as(db, anon, () => db.query(`select * from public.${table}`))).rejects.toThrow(/permission denied/)
    },
  )

  it('ne peuvent pas modifier un site', async () => {
    await expect(
      as(db, anon, () => db.query(`update public.weddings set partner_one_name = 'Hack'`)),
    ).rejects.toThrow(/permission denied/)
  })

  it('ne peuvent pas écrire directement dans le livre d’or', async () => {
    await expect(
      as(db, anon, () =>
        db.query(
          `insert into public.guestbook_messages (wedding_id, author_name, message) values ($1, 'a', 'b')`,
          [ID.wedA],
        ),
      ),
    ).rejects.toThrow(/permission denied/)
  })

  it('ne peuvent pas appeler les RPC de contrôle d’accès', async () => {
    await expect(
      as(db, anon, () => db.query(`select public.perform_check_in($1, $2, null)`, [ID.wedA, 'x'.repeat(64)])),
    ).rejects.toThrow(/permission denied/)
  })

  it('ne lisent que le contenu public d’un site publié', async () => {
    const site = await rpc<{ wedding: { slug: string }; guestbook: { message: string }[]; guests?: unknown }>(
      anon,
      `public.get_public_wedding($1)`,
      ['amelieetyoan'],
    )
    expect(site.wedding.slug).toBe('amelieetyoan')
    expect(site.guests).toBeUndefined()
    // seuls les messages approuvés sont publics
    expect(site.guestbook.map((m) => m.message)).toEqual(['Message approuvé'])
  })

  it('ne voient ni un brouillon ni un slug inconnu', async () => {
    expect(await rpc(anon, `public.get_public_wedding($1)`, ['brouillon-2027'])).toBeNull()
    expect(await rpc(anon, `public.get_public_wedding($1)`, ['inconnu'])).toBeNull()
  })

  it('ne peuvent pas obtenir l’aperçu d’un brouillon', async () => {
    expect(await rpc(anon, `public.get_public_wedding($1, true)`, ['brouillon-2027'])).toBeNull()
  })

  it('le couple obtient l’aperçu de son brouillon, pas celui des autres', async () => {
    await db.query(
      `insert into public.wedding_memberships (wedding_id, user_id, member_role) values ($1, $2, 'couple')`,
      [ID.wedDraft, ID.hostessFree === ID.hostessFree ? ID.coupleB : ID.coupleB],
    )
    expect(await rpc(user(ID.coupleB), `public.get_public_wedding($1, true)`, ['brouillon-2027'])).not.toBeNull()
    expect(await rpc(user(ID.coupleA), `public.get_public_wedding($1, true)`, ['brouillon-2027'])).toBeNull()
    await db.query(`delete from public.wedding_memberships where wedding_id = $1`, [ID.wedDraft])
  })
})

describe('livre d’or', () => {
  it('un message soumis est en attente de modération', async () => {
    const res = await rpc<{ ok: boolean }>(anon, `public.submit_guestbook_message($1, $2, $3)`, [
      'amelieetyoan', 'Marie', 'Tous nos vœux !',
    ])
    expect(res.ok).toBe(true)
    const { rows } = await db.query<{ status: string }>(
      `select status::text from public.guestbook_messages where author_name = 'Marie'`,
    )
    expect(rows[0].status).toBe('pending')
    const site = await rpc<{ guestbook: { author_name: string }[] }>(anon, `public.get_public_wedding($1)`, ['amelieetyoan'])
    expect(site.guestbook.map((m) => m.author_name)).not.toContain('Marie')
  })

  it('valide les entrées et limite le débit', async () => {
    const bad = await rpc<{ code: string }>(anon, `public.submit_guestbook_message($1, $2, $3)`, ['amelieetyoan', '', 'x'])
    expect(bad.code).toBe('invalid_input')
    let last = { code: '' }
    for (let i = 0; i < 12; i++) {
      last = await rpc(anon, `public.submit_guestbook_message($1, $2, $3)`, ['amelieetyoan', `Flood ${i}`, 'spam'])
    }
    expect(last.code).toBe('rate_limited')
  })

  it('le couple approuve ; l’autre couple ne le peut pas', async () => {
    const { rows } = await db.query<{ id: string }>(
      `select id from public.guestbook_messages where author_name = 'Marie'`,
    )
    const id = rows[0].id
    const other = await as(db, user(ID.coupleB), () =>
      db.query(`update public.guestbook_messages set status = 'approved' where id = $1`, [id]),
    )
    expect(other.affectedRows).toBe(0)
    const mine = await as(db, user(ID.coupleA), () =>
      db.query(`update public.guestbook_messages set status = 'approved' where id = $1`, [id]),
    )
    expect(mine.affectedRows).toBe(1)
    const site = await rpc<{ guestbook: { author_name: string }[] }>(anon, `public.get_public_wedding($1)`, ['amelieetyoan'])
    expect(site.guestbook.map((m) => m.author_name)).toContain('Marie')
  })
})

describe('RSVP', () => {
  const submit = (name: string, status: string, companions = 0, phone: string | null = null, email: string | null = null) =>
    rpc<{ ok: boolean; code: string }>(anon, `public.submit_rsvp($1, $2, $3::public.rsvp_status, $4, $5, $6)`, [
      'amelieetyoan', name, status, companions, phone, email,
    ])

  it('rejette un statut ou un nom invalide', async () => {
    expect((await submit('A', 'confirmed')).code).toBe('invalid_input')
    expect((await submit('Carl Mbarga', 'pending')).code).toBe('invalid_input')
    expect((await submit('Carl Mbarga', 'confirmed', -1)).code).toBe('invalid_input')
  })

  it('refuse un invité inconnu (liste fermée par défaut)', async () => {
    expect((await submit('Quelqu’un Dautre', 'confirmed')).code).toBe('guest_not_found')
  })

  it('n’autorise jamais plus d’accompagnants que prévu', async () => {
    expect((await submit('Carl Mbarga', 'confirmed', 4)).code).toBe('companions_exceeded')
  })

  it('associe la réponse à l’invité existant sans créer de doublon', async () => {
    const before = (await db.query(`select 1 from public.guests where wedding_id = $1`, [ID.wedA])).rows.length
    expect((await submit('  carl   MBARGA ', 'confirmed', 2)).ok).toBe(true)
    expect((await submit('Carl Mbarga', 'confirmed', 3)).ok).toBe(true)
    const after = (await db.query(`select 1 from public.guests where wedding_id = $1`, [ID.wedA])).rows.length
    expect(after).toBe(before)
    const { rows } = await db.query<{ rsvp_status: string; confirmed_companions: number }>(
      `select rsvp_status::text, confirmed_companions from public.guests where id = $1`, [ID.carl],
    )
    expect(rows[0]).toEqual({ rsvp_status: 'confirmed', confirmed_companions: 3 })
  })

  it('exige une coordonnée correspondante quand l’invité en a une', async () => {
    expect((await submit('Alice Martin', 'confirmed')).code).toBe('guest_not_found')
    expect((await submit('Alice Martin', 'confirmed', 0, null, 'autre@example.com')).code).toBe('guest_not_found')
    expect((await submit('Alice Martin', 'confirmed', 1, null, 'ALICE@example.com')).ok).toBe(true)
  })

  it('un refus remet les accompagnants confirmés à zéro', async () => {
    expect((await submit('Carl Mbarga', 'declined', 2)).ok).toBe(true)
    const { rows } = await db.query<{ confirmed_companions: number }>(
      `select confirmed_companions from public.guests where id = $1`, [ID.carl],
    )
    expect(rows[0].confirmed_companions).toBe(0)
    // Remise à l'état initial pour les scénarios suivants
    await db.query(`update public.guests set rsvp_status = 'pending' where id = $1`, [ID.carl])
  })

  it('accepte un invité non listé seulement si le couple l’a autorisé', async () => {
    await db.query(
      `update public.weddings set settings = '{"rsvp":{"enabled":true,"allow_unlisted":true,"max_companions_unlisted":1}}' where id = $1`,
      [ID.wedA],
    )
    expect((await submit('Nouvel Invité', 'confirmed', 2)).code).toBe('companions_exceeded')
    expect((await submit('Nouvel Invité', 'confirmed', 1)).ok).toBe(true)
    await db.query(`update public.weddings set settings = '{"rsvp":{"enabled":true}}' where id = $1`, [ID.wedA])
  })

  it('respecte la fermeture des RSVP', async () => {
    await db.query(`update public.weddings set settings = '{"rsvp":{"enabled":false}}' where id = $1`, [ID.wedA])
    expect((await submit('Carl Mbarga', 'confirmed')).code).toBe('rsvp_closed')
    await db.query(`update public.weddings set settings = '{"rsvp":{"enabled":true}}' where id = $1`, [ID.wedA])
  })
})

describe('tables et capacité', () => {
  it('refuse un dépassement de capacité', async () => {
    // Table 2 : capacité 2 ; Carl (+3) = 4 places
    await expect(
      db.query(`update public.guests set table_id = $1 where id = $2`, [ID.tableA2, ID.carl]),
    ).rejects.toThrow(/table_capacity_exceeded/)
  })

  it('compte les places des accompagnants (Alice +1 = 2, Bob = 1)', async () => {
    // Table 1 : capacité 4, déjà Alice(2)+Bob(1)=3 ; Erin(1) tient, Frank(1) dépasse
    await db.query(`update public.guests set table_id = $1 where id = $2`, [ID.tableA1, ID.erin])
    await expect(
      db.query(`update public.guests set table_id = $1 where id = $2`, [ID.tableA1, ID.frank]),
    ).rejects.toThrow(/table_capacity_exceeded/)
    await db.query(`update public.guests set table_id = null where id = $1`, [ID.erin])
  })

  it('refuse de réduire la capacité sous l’occupation', async () => {
    await expect(
      db.query(`update public.tables set capacity = 2 where id = $1`, [ID.tableA1]),
    ).rejects.toThrow(/table_capacity_exceeded/)
  })

  it('refuse une table appartenant à un autre mariage', async () => {
    await expect(
      db.query(`update public.guests set table_id = $1 where id = $2`, [ID.tableB1, ID.erin]),
    ).rejects.toThrow(/guests_table_same_wedding/)
  })

  it('empêche un client d’écrire l’arrivée effective', async () => {
    await expect(
      as(db, user(ID.coupleA), () =>
        db.query(`update public.guests set arrived_count = 1, arrived_at = now() where id = $1`, [ID.bob]),
      ),
    ).rejects.toThrow(/arrival_write_forbidden/)
  })
})

describe('contrôle d’accès par QR code', () => {
  const scan = (actor: Parameters<typeof as>[1], wedding: string, tok: string, party: number | null = null) =>
    rpc<Record<string, any>>(actor, `public.perform_check_in($1, $2, $3)`, [wedding, tok, party])

  it('valide un QR et affiche la table', async () => {
    const res = await scan(user(ID.hostessA), ID.wedA, await token(ID.bob))
    expect(res).toMatchObject({ ok: true, code: 'success', guest_name: 'Bob Nkoulou', table_name: 'Table 1', party_size: 1 })
  })

  it('refuse un second scan du même code (déjà enregistré)', async () => {
    const res = await scan(user(ID.hostessA), ID.wedA, await token(ID.bob))
    expect(res).toMatchObject({ ok: false, code: 'already_checked_in', arrived_count: 1 })
  })

  it('un seul contrôle initial réussi par invité (filet d’unicité en base)', async () => {
    await expect(
      db.query(
        `insert into public.check_ins (wedding_id, guest_id, result, party_size) values ($1, $2, 'success', 1)`,
        [ID.wedA, ID.bob],
      ),
    ).rejects.toThrow(/check_ins_one_success_per_guest/)
    const { rows } = await db.query(`select 1 from public.check_ins where guest_id = $1 and result = 'success'`, [ID.bob])
    expect(rows).toHaveLength(1)
  })

  it('refuse le QR d’un autre mariage sans révéler d’identité', async () => {
    const res = await scan(user(ID.hostessA), ID.wedA, await token(ID.henri))
    expect(res).toEqual({ ok: false, code: 'wrong_wedding' })
  })

  it('refuse un code inconnu', async () => {
    expect((await scan(user(ID.hostessA), ID.wedA, 'a'.repeat(64))).code).toBe('unknown_token')
  })

  it('refuse une hôtesse non attribuée à ce mariage', async () => {
    expect((await scan(user(ID.hostessFree), ID.wedA, await token(ID.erin))).code).toBe('forbidden')
    expect((await scan(user(ID.hostessA), ID.wedB, await token(ID.henri))).code).toBe('forbidden')
  })

  it('refuse un invité qui a décliné', async () => {
    const res = await scan(user(ID.hostessA), ID.wedA, await token(ID.dan))
    expect(res.code).toBe('rsvp_declined')
  })

  it('respecte le nombre maximal de participants', async () => {
    const tok = await token(ID.carl)
    const tooMany = await scan(user(ID.hostessA), ID.wedA, tok, 5)
    expect(tooMany).toMatchObject({ ok: false, code: 'party_size_exceeded', allowed_party: 4 })
    const partial = await scan(user(ID.hostessA), ID.wedA, tok, 2)
    expect(partial).toMatchObject({ ok: true, party_size: 2, allowed_party: 4 })
  })

  it('refuse un QR révoqué, puis accepte le nouveau code après renouvellement', async () => {
    const oldTok = await token(ID.erin)
    expect((await rpc(user(ID.coupleA), `public.revoke_guest_qr($1)`, [ID.erin])).ok).toBe(true)
    const revoked = await scan(user(ID.hostessA), ID.wedA, oldTok)
    expect(revoked).toMatchObject({ ok: false, code: 'revoked_token', guest_name: 'Erin Test' })

    expect((await rpc(user(ID.coupleA), `public.renew_guest_qr($1)`, [ID.erin])).ok).toBe(true)
    const newTok = await token(ID.erin)
    expect(newTok).not.toBe(oldTok)
    expect((await scan(user(ID.hostessA), ID.wedA, oldTok)).code).toBe('revoked_token')
    expect((await scan(user(ID.hostessA), ID.wedA, newTok)).ok).toBe(true)
  })

  it('l’autre couple ne peut pas révoquer ni renouveler un QR', async () => {
    expect((await rpc(user(ID.coupleB), `public.revoke_guest_qr($1)`, [ID.alice])).code).toBe('forbidden')
    expect((await rpc(user(ID.coupleB), `public.renew_guest_qr($1)`, [ID.alice])).code).toBe('forbidden')
    expect((await rpc(user(ID.hostessA), `public.revoke_guest_qr($1)`, [ID.alice])).code).toBe('forbidden')
  })

  it('l’admin ou le couple peut annuler un contrôle erroné, pas l’hôtesse', async () => {
    await scan(user(ID.hostessA), ID.wedA, await token(ID.frank))
    expect((await rpc(user(ID.hostessA), `public.cancel_check_in($1)`, [ID.frank])).code).toBe('forbidden')
    expect((await rpc(user(ID.coupleB), `public.cancel_check_in($1)`, [ID.frank])).code).toBe('forbidden')
    expect((await rpc(user(ID.coupleA), `public.cancel_check_in($1)`, [ID.frank])).ok).toBe(true)
    expect((await scan(user(ID.hostessA), ID.wedA, await token(ID.frank))).ok).toBe(true)
  })

  it('l’alternative sans caméra passe par la même logique atomique', async () => {
    const found = await as(db, user(ID.hostessA), async () =>
      (await db.query<{ guest_id: string; full_name: string }>(
        `select * from public.search_guests_for_check_in($1, 'alice')`, [ID.wedA],
      )).rows,
    )
    expect(found).toHaveLength(1)
    expect(Object.keys(found[0])).not.toContain('email')
    const res = await rpc<Record<string, any>>(user(ID.hostessA), `public.perform_check_in_by_guest($1, $2, null)`, [ID.wedA, found[0].guest_id])
    expect(res).toMatchObject({ ok: true, guest_name: 'Alice Martin' })
    const again = await rpc<Record<string, any>>(user(ID.hostessA), `public.perform_check_in_by_guest($1, $2, null)`, [ID.wedA, found[0].guest_id])
    expect(again.code).toBe('already_checked_in')
  })

  it('la recherche hôtesse échappe les jokers et refuse l’accès hors mariage', async () => {
    const wild = await as(db, user(ID.hostessA), async () =>
      (await db.query(`select * from public.search_guests_for_check_in($1, '%%')`, [ID.wedA])).rows,
    )
    expect(wild).toHaveLength(0)
    await expect(
      as(db, user(ID.hostessA), () => db.query(`select * from public.search_guests_for_check_in($1, 'henri')`, [ID.wedB])),
    ).rejects.toThrow(/forbidden/)
  })

  it('fournit progression et derniers contrôles à l’hôtesse', async () => {
    const stats = await rpc<{ expected_guests: number; arrived_guests: number; arrived_people: number }>(
      user(ID.hostessA), `public.check_in_stats($1)`, [ID.wedA],
    )
    expect(stats.arrived_guests).toBeGreaterThanOrEqual(3)
    const recent = await as(db, user(ID.hostessA), async () =>
      (await db.query<{ guest_name: string }>(`select * from public.recent_check_ins($1, 10)`, [ID.wedA])).rows,
    )
    expect(recent.length).toBeGreaterThanOrEqual(3)
    expect(Object.keys(recent[0]).sort()).toEqual(['checked_in_at', 'guest_name', 'method', 'party_size', 'table_name'])
  })

  it('un mariage archivé n’accepte plus de contrôle', async () => {
    await db.query(`update public.weddings set status = 'archived' where id = $1`, [ID.wedB])
    await db.query(
      `insert into public.wedding_memberships (wedding_id, user_id, member_role) values ($1, $2, 'hostess')`,
      [ID.wedB, ID.hostessFree],
    )
    const res = await scan(user(ID.hostessFree), ID.wedB, await token(ID.henri))
    expect(res.code).toBe('wedding_closed')
    await db.query(`update public.weddings set status = 'published' where id = $1`, [ID.wedB])
  })
})

describe('journal d’activité et contact', () => {
  it('seul l’admin lit le journal', async () => {
    const asAdmin = await as(db, user(ID.admin), async () => (await db.query(`select 1 from public.audit_logs`)).rows.length)
    expect(asAdmin).toBeGreaterThan(0)
    const asCouple = await as(db, user(ID.coupleA), async () => (await db.query(`select 1 from public.audit_logs`)).rows.length)
    expect(asCouple).toBe(0)
  })

  it('le formulaire de contact valide et limite le débit ; seul l’admin lit', async () => {
    const bad = await rpc<{ code: string }>(anon, `public.submit_contact_message($1, $2, $3)`, ['A', 'pas-un-email', 'Bonjour'])
    expect(bad.code).toBe('invalid_input')
    const ok = await rpc<{ ok: boolean }>(anon, `public.submit_contact_message($1, $2, $3)`, ['Aïcha', 'aicha@example.com', 'Je souhaite un devis'])
    expect(ok.ok).toBe(true)
    const asCouple = await as(db, user(ID.coupleA), async () => (await db.query(`select 1 from public.contact_messages`)).rows.length)
    expect(asCouple).toBe(0)
  })

  it('les paramètres publics sont lisibles par les visiteurs, pas les autres', async () => {
    await db.query(`insert into public.platform_settings (key, value, is_public) values ('internal.secret', '{"a":1}', false)`)
    const keys = await as(db, anon, async () =>
      (await db.query<{ key: string }>(`select key from public.platform_settings`)).rows.map((r) => r.key),
    )
    expect(keys).toContain('contact')
    expect(keys).not.toContain('internal.secret')
  })
})

describe('storage', () => {
  const insertObject = (actor: Parameters<typeof as>[1], name: string, bucket = 'wedding-images') =>
    as(db, actor, () => db.query(`insert into storage.objects (bucket_id, name) values ($1, $2)`, [bucket, name]))

  it('le couple téléverse dans son dossier uniquement', async () => {
    await expect(insertObject(user(ID.coupleA), `${ID.wedA}/gallery/photo1.jpg`)).resolves.toBeDefined()
    await expect(insertObject(user(ID.coupleA), `${ID.wedB}/gallery/photo1.jpg`)).rejects.toThrow(/row-level security/)
  })

  it('refuse extension non autorisée, chemin invalide et visiteurs anonymes', async () => {
    await expect(insertObject(user(ID.coupleA), `${ID.wedA}/gallery/script.exe`)).rejects.toThrow(/row-level security/)
    await expect(insertObject(user(ID.coupleA), `n-importe-quoi/photo.jpg`)).rejects.toThrow(/row-level security/)
    await expect(insertObject(anon, `${ID.wedA}/gallery/photo.jpg`)).rejects.toThrow(/permission denied|row-level security/)
  })

  it('l’hôtesse ne peut rien téléverser', async () => {
    await expect(insertObject(user(ID.hostessA), `${ID.wedA}/gallery/h.jpg`)).rejects.toThrow(/row-level security/)
  })

  it('la musique n’accepte que des extensions audio', async () => {
    await expect(insertObject(user(ID.coupleA), `${ID.wedA}/music/theme.mp3`, 'wedding-audio')).resolves.toBeDefined()
    await expect(insertObject(user(ID.coupleA), `${ID.wedA}/music/theme.jpg`, 'wedding-audio')).rejects.toThrow(/row-level security/)
  })
})
