import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando base de datos...')

  await prisma.orderItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.event.deleteMany()
  await prisma.form.deleteMany()
  await prisma.bar.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creando usuarios...')

  const admin = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'admin@appbar.com',
      password: hashSync('admin123', 10),
      firstName: 'Admin',
      lastName: 'AppBar',
      role: 'SUPER_ADMIN',
    },
  })

  const barAdmin = await prisma.user.create({
    data: {
      id: uuid(),
      email: 'chela@bar.com',
      password: hashSync('chela123', 10),
      firstName: 'Carlos',
      lastName: 'Mendez',
      phone: '987654321',
      role: 'BAR_ADMIN',
    },
  })

  console.log('Creando bar...')

  const bar = await prisma.bar.create({
    data: {
      id: uuid(),
      name: 'Chela Bar',
      slug: 'chela',
      description: 'El mejor bar de la ciudad. Tragos artesanales, cerveza tirada y la mejor musica en vivo.',
      address: 'Av. Larco 345, Miraflores',
      phone: '01-4567890',
      adminId: barAdmin.id,
      socialMedia: { instagram: '@chelabar', facebook: 'chelabar' },
      schedule: 'Mar-Jue 18:00 a 01:00 | Vie 18:00 a 03:00 | Sab 17:00 a 03:00 | Dom 17:00 a 00:00 | Lun cerrado',
    },
  })

  console.log('Creando formularios...')

  const formBasico = await prisma.form.create({
    data: {
      id: uuid(),
      name: 'Registro basico',
      barId: bar.id,
      fields: [
        { type: 'text', label: 'Nombre completo', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'phone', label: 'Telefono', required: false },
      ],
    },
  })

  const formVIP = await prisma.form.create({
    data: {
      id: uuid(),
      name: 'Registro VIP',
      barId: bar.id,
      fields: [
        { type: 'text', label: 'Nombre completo', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'phone', label: 'Telefono', required: true },
        { type: 'number', label: 'DNI', required: true },
        { type: 'select', label: 'Zona preferida', required: true, options: ['General', 'VIP', 'Backstage'] },
      ],
    },
  })

  console.log('Creando eventos...')

  // Evento 1: FREE - sin formulario
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Noche de Trivia',
      description: 'Veni con tus amigos a demostrar quien sabe mas. Equipos de 2 a 6 personas. Premios para los 3 primeros puestos.',
      barId: bar.id,
      startDate: new Date('2026-03-15T20:00:00'),
      endDate: new Date('2026-03-15T23:30:00'),
      accessType: 'FREE',
      hasAccessControl: true,
      capacity: 60,
      isActive: true,
    },
  })

  // Evento 2: FREE - sin formulario
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'After Office Viernes',
      description: 'Arranca el finde con buena musica y 2x1 en pintas hasta las 21hs.',
      barId: bar.id,
      startDate: new Date('2026-03-21T18:00:00'),
      endDate: new Date('2026-03-22T01:00:00'),
      accessType: 'FREE',
      hasAccessControl: false,
      capacity: 120,
      isActive: true,
    },
  })

  // Evento 3: FREE_WITH_FORM - formulario basico
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Cata de Cervezas Artesanales',
      description: 'Degustacion de 6 cervezas artesanales de distintas cervecerias locales. Incluye tabla de quesos.',
      barId: bar.id,
      startDate: new Date('2026-03-22T19:00:00'),
      endDate: new Date('2026-03-22T22:00:00'),
      accessType: 'FREE_WITH_FORM',
      formId: formBasico.id,
      hasAccessControl: true,
      capacity: 30,
      isActive: true,
    },
  })

  // Evento 4: FREE_WITH_FORM - formulario basico
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Karaoke Night',
      description: 'Anotate y subi al escenario. Los mejores covers de la noche ganan consumiciones gratis.',
      barId: bar.id,
      startDate: new Date('2026-03-28T21:00:00'),
      endDate: new Date('2026-03-29T02:00:00'),
      accessType: 'FREE_WITH_FORM',
      formId: formBasico.id,
      hasAccessControl: true,
      capacity: 80,
      isActive: true,
    },
  })

  // Evento 5: PAID - con formulario VIP
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'DJ Set Electronica',
      description: 'Los mejores DJs de la escena electronica local. Barra libre de shots incluida.',
      barId: bar.id,
      startDate: new Date('2026-03-29T22:00:00'),
      endDate: new Date('2026-03-30T04:00:00'),
      accessType: 'PAID',
      formId: formVIP.id,
      price: 35,
      hasAccessControl: true,
      capacity: 200,
      isActive: true,
    },
  })

  // Evento 6: PAID - con formulario VIP
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Noche de Stand Up Comedy',
      description: '3 comediantes en vivo. 2 horas de show + meet & greet al finalizar.',
      barId: bar.id,
      startDate: new Date('2026-04-04T21:00:00'),
      endDate: new Date('2026-04-04T23:30:00'),
      accessType: 'PAID',
      formId: formBasico.id,
      price: 25,
      hasAccessControl: true,
      capacity: 100,
      isActive: true,
    },
  })

  // Evento 7: PAID - premium
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Fiesta Aniversario Chela Bar',
      description: 'Celebramos 5 anos. Open bar premium, DJ internacional, show de luces. La noche mas esperada del ano.',
      barId: bar.id,
      startDate: new Date('2026-04-12T22:00:00'),
      endDate: new Date('2026-04-13T05:00:00'),
      accessType: 'PAID',
      formId: formVIP.id,
      price: 80,
      hasAccessControl: true,
      capacity: 300,
      isActive: true,
    },
  })

  // Evento 8: PAID - medio
  await prisma.event.create({
    data: {
      id: uuid(),
      title: 'Rock en Vivo - Banda Invitada',
      description: 'Noche de rock nacional con banda en vivo. Entrada incluye 1 pinta.',
      barId: bar.id,
      startDate: new Date('2026-04-05T21:00:00'),
      endDate: new Date('2026-04-06T01:00:00'),
      accessType: 'PAID',
      formId: formBasico.id,
      price: 40,
      hasAccessControl: true,
      capacity: 150,
      isActive: true,
    },
  })

  console.log('Creando menu...')

  // Bebidas
  const catBebidas = await prisma.menuCategory.create({
    data: { id: uuid(), name: 'Bebidas', order: 1, barId: bar.id },
  })
  const bebidas = [
    { name: 'Coca Cola', description: 'Lata 354ml', price: 20, order: 1 },
    { name: 'Agua mineral', description: 'Con o sin gas 500ml', price: 20, order: 2 },
    { name: 'Jugo de naranja', description: 'Exprimido natural', price: 25, order: 3 },
    { name: 'Red Bull', description: 'Lata 250ml', price: 35, order: 4 },
  ]
  for (const b of bebidas) {
    await prisma.menuItem.create({ data: { id: uuid(), ...b, categoryId: catBebidas.id } })
  }

  // Cervezas
  const catCervezas = await prisma.menuCategory.create({
    data: { id: uuid(), name: 'Cervezas', order: 2, barId: bar.id },
  })
  const cervezas = [
    { name: 'Quilmes', description: 'Pinta tirada 500ml', price: 30, order: 1 },
    { name: 'Patagonia Amber', description: 'Pinta 500ml', price: 35, order: 2 },
    { name: 'IPA Artesanal', description: 'Pinta de la casa 500ml', price: 40, order: 3 },
    { name: 'Corona', description: 'Botella 355ml', price: 35, order: 4 },
    { name: 'Heineken', description: 'Pinta tirada 500ml', price: 35, order: 5 },
  ]
  for (const c of cervezas) {
    await prisma.menuItem.create({ data: { id: uuid(), ...c, categoryId: catCervezas.id } })
  }

  // Tragos
  const catTragos = await prisma.menuCategory.create({
    data: { id: uuid(), name: 'Tragos', order: 3, barId: bar.id },
  })
  const tragos = [
    { name: 'Fernet con Coca', description: 'Clasico argentino', price: 40, order: 1 },
    { name: 'Gin Tonic', description: 'Gin, tonica, pepino y romero', price: 50, order: 2 },
    { name: 'Mojito', description: 'Ron, menta, lima, soda', price: 45, order: 3 },
    { name: 'Aperol Spritz', description: 'Aperol, prosecco, soda', price: 50, order: 4 },
    { name: 'Negroni', description: 'Gin, Campari, vermut rojo', price: 55, order: 5 },
  ]
  for (const t of tragos) {
    await prisma.menuItem.create({ data: { id: uuid(), ...t, categoryId: catTragos.id } })
  }

  // Comidas
  const catComidas = await prisma.menuCategory.create({
    data: { id: uuid(), name: 'Comidas', order: 4, barId: bar.id },
  })
  const comidas = [
    { name: 'Papas fritas', description: 'Porcion con salsa de la casa', price: 30, order: 1 },
    { name: 'Nachos con guacamole', description: 'Nachos con guacamole y cheddar', price: 45, order: 2 },
    { name: 'Hamburguesa clasica', description: 'Carne 200g, lechuga, tomate, cheddar, papas', price: 65, order: 3 },
    { name: 'Picada para 2', description: 'Jamon, queso, aceitunas, pan casero', price: 70, order: 4 },
    { name: 'Empanadas x3', description: 'Carne, jamon y queso, o verdura', price: 35, order: 5 },
  ]
  for (const c of comidas) {
    await prisma.menuItem.create({ data: { id: uuid(), ...c, categoryId: catComidas.id } })
  }

  console.log('Creando 9 bares adicionales...')

  const extraBars = [
    {
      adminEmail: 'luna@bar.com', adminFirst: 'Lucia', adminLast: 'Torres',
      name: 'La Luna Roja', slug: 'luna-roja',
      description: 'Cocteleria de autor en un ambiente intimo con musica jazz en vivo los jueves y viernes.',
      address: 'Jr. de la Union 412, Centro de Lima',
      schedule: 'Mie-Dom 19:00 a 02:00',
      events: [
        { title: 'Jazz Night', description: 'Trio de jazz en vivo con repertorio clasico y moderno.', startDate: '2026-03-20T21:00:00', accessType: 'FREE' as const, capacity: 40 },
        { title: 'Cocteles de Temporada', description: 'Degustacion de 4 cocteles nuevos creados por nuestro bartender.', startDate: '2026-03-27T20:00:00', accessType: 'PAID' as const, price: 45, capacity: 25 },
      ],
    },
    {
      adminEmail: 'voodoo@bar.com', adminFirst: 'Andres', adminLast: 'Rios',
      name: 'Voodoo Lounge', slug: 'voodoo',
      description: 'Rock bar con escenario propio. Bandas locales todas las semanas y las mejores hamburguesas de la zona.',
      address: 'Calle Schell 189, Miraflores',
      schedule: 'Mar-Sab 20:00 a 03:00',
      events: [
        { title: 'Battle of Bands', description: '4 bandas compiten por el titulo. El publico vota al ganador.', startDate: '2026-03-22T21:00:00', accessType: 'PAID' as const, price: 30, capacity: 150 },
        { title: 'Open Mic Night', description: 'Traje tu guitarra y subi al escenario. Inscripcion en la barra.', startDate: '2026-04-01T20:30:00', accessType: 'FREE' as const, capacity: 80 },
        { title: 'Tributo a Soda Stereo', description: 'La mejor banda tributo del pais. 2 horas de show imperdible.', startDate: '2026-04-10T22:00:00', accessType: 'PAID' as const, price: 50, capacity: 200 },
      ],
    },
    {
      adminEmail: 'terraza@bar.com', adminFirst: 'Marina', adminLast: 'Vargas',
      name: 'Terraza 27', slug: 'terraza-27',
      description: 'Rooftop bar con vista panoramica a la ciudad. Atardeceres, cocteles premium y musica chill.',
      address: 'Av. Pardo 827, Piso 27, Miraflores',
      schedule: 'Lun-Dom 17:00 a 01:00',
      events: [
        { title: 'Sunset Session', description: 'DJ set mientras cae el sol. Dress code smart casual.', startDate: '2026-03-21T17:30:00', accessType: 'FREE' as const, capacity: 60 },
        { title: 'Wine & Cheese Night', description: 'Seleccion de 5 vinos con maridaje de quesos artesanales.', startDate: '2026-04-03T19:00:00', accessType: 'PAID' as const, price: 65, capacity: 30 },
      ],
    },
    {
      adminEmail: 'sotano@bar.com', adminFirst: 'Diego', adminLast: 'Paredes',
      name: 'El Sotano', slug: 'el-sotano',
      description: 'Bar subterraneo estilo speakeasy. Tragos clasicos, iluminacion tenue y buena conversacion.',
      address: 'Calle Berlín 356, Miraflores',
      schedule: 'Jue-Sab 21:00 a 03:00',
      events: [
        { title: 'Noche de Poker', description: 'Torneo de Texas Hold\'em. Buy-in $30, premio para los 3 primeros.', startDate: '2026-03-27T22:00:00', accessType: 'PAID' as const, price: 30, capacity: 24 },
      ],
    },
    {
      adminEmail: 'neon@bar.com', adminFirst: 'Valentina', adminLast: 'Cruz',
      name: 'Neon Club', slug: 'neon-club',
      description: 'La discoteca mas grande de Barranco. 3 ambientes, DJs internacionales y produccion de primer nivel.',
      address: 'Av. Grau 294, Barranco',
      schedule: 'Vie-Sab 23:00 a 06:00',
      events: [
        { title: 'Neon Fridays', description: 'La fiesta electronica de cada viernes. Guest DJ cada semana.', startDate: '2026-03-21T23:00:00', accessType: 'PAID' as const, price: 40, capacity: 500 },
        { title: 'Reggaeton Fest', description: 'Lo mejor del reggaeton y urbano latino. 3 DJs, show de luces laser.', startDate: '2026-03-28T23:00:00', accessType: 'PAID' as const, price: 35, capacity: 500 },
        { title: 'Noche de los 2000s', description: 'Revivi la mejor epoca. Hits del 2000 al 2010 toda la noche.', startDate: '2026-04-04T23:00:00', accessType: 'PAID' as const, price: 30, capacity: 400 },
        { title: 'Festival Electronico', description: 'Line-up de 6 DJs, 12 horas de musica. El evento del mes.', startDate: '2026-04-11T22:00:00', accessType: 'PAID' as const, price: 80, capacity: 800 },
      ],
    },
    {
      adminEmail: 'patio@bar.com', adminFirst: 'Camila', adminLast: 'Herrera',
      name: 'El Patio Cervecero', slug: 'patio-cervecero',
      description: 'Cerveceria artesanal con patio al aire libre. 12 canillas rotativas y comida ahumada.',
      address: 'Av. San Martin 1045, Barranco',
      schedule: 'Mar-Dom 12:00 a 00:00',
      events: [
        { title: 'Beer Fest Artesanal', description: '8 cervecerias invitadas, degustacion libre con tu entrada.', startDate: '2026-03-29T14:00:00', accessType: 'PAID' as const, price: 50, capacity: 200 },
        { title: 'Domingo de Asado', description: 'Asado argentino + cerveza tirada ilimitada por 2 horas.', startDate: '2026-04-06T13:00:00', accessType: 'PAID' as const, price: 70, capacity: 60 },
      ],
    },
    {
      adminEmail: 'santos@bar.com', adminFirst: 'Gabriel', adminLast: 'Mora',
      name: 'Santos Pecados', slug: 'santos-pecados',
      description: 'Bar tematico con shows de cabaret, burlesque y drag. Cada noche es diferente.',
      address: 'Calle Colon 180, Miraflores',
      schedule: 'Mie-Sab 21:00 a 03:00',
      events: [
        { title: 'Drag Show Spectacular', description: 'Las mejores drag queens de Lima en un show de 2 horas.', startDate: '2026-03-22T22:00:00', accessType: 'PAID' as const, price: 35, capacity: 100 },
        { title: 'Noche de Burlesque', description: 'Show de burlesque clasico con artistas internacionales.', startDate: '2026-04-05T22:00:00', accessType: 'PAID' as const, price: 45, capacity: 80 },
      ],
    },
    {
      adminEmail: 'oliva@bar.com', adminFirst: 'Florencia', adminLast: 'Nunez',
      name: 'La Oliva Wine Bar', slug: 'la-oliva',
      description: 'Wine bar con mas de 80 etiquetas nacionales e importadas. Tablas artesanales y ambiente sofisticado.',
      address: 'Av. Conquistadores 468, San Isidro',
      schedule: 'Lun-Sab 18:00 a 00:00',
      events: [
        { title: 'Cata de Vinos Argentinos', description: '6 vinos de Mendoza con sommelier certificado.', startDate: '2026-03-25T19:30:00', accessType: 'PAID' as const, price: 60, capacity: 20 },
      ],
    },
    {
      adminEmail: 'garage@bar.com', adminFirst: 'Tomas', adminLast: 'Espinoza',
      name: 'Garage Pub', slug: 'garage-pub',
      description: 'Pub estilo britanico con futbol en pantalla gigante, dardos, pool y pintas baratas.',
      address: 'Calle Porta 294, Miraflores',
      schedule: 'Lun-Dom 16:00 a 02:00',
      events: [
        { title: 'Champions League en Pantalla', description: 'Veni a ver los partidos en pantalla gigante. Promos en pintas.', startDate: '2026-04-08T14:00:00', accessType: 'FREE' as const, capacity: 80 },
        { title: 'Torneo de Pool', description: 'Torneo de 8-ball. Inscripcion gratis, premio: barra libre.', startDate: '2026-04-02T20:00:00', accessType: 'FREE' as const, capacity: 32 },
        { title: 'Pub Quiz Friday', description: 'Trivia de cultura general con premios. Equipos de hasta 5.', startDate: '2026-03-28T20:00:00', accessType: 'FREE' as const, capacity: 50 },
      ],
    },
  ]

  for (const b of extraBars) {
    const barAdminUser = await prisma.user.create({
      data: {
        id: uuid(),
        email: b.adminEmail,
        password: hashSync('bar123', 10),
        firstName: b.adminFirst,
        lastName: b.adminLast,
        role: 'BAR_ADMIN',
      },
    })

    const newBar = await prisma.bar.create({
      data: {
        id: uuid(),
        name: b.name,
        slug: b.slug,
        description: b.description,
        address: b.address,
        schedule: b.schedule,
        adminId: barAdminUser.id,
      },
    })

    for (const ev of b.events) {
      await prisma.event.create({
        data: {
          id: uuid(),
          title: ev.title,
          description: ev.description,
          barId: newBar.id,
          startDate: new Date(ev.startDate),
          accessType: ev.accessType,
          price: ev.price || null,
          capacity: ev.capacity,
          hasAccessControl: true,
          isActive: true,
        },
      })
    }
  }

  console.log('')
  console.log('=== SEED COMPLETADO ===')
  console.log('')
  console.log('Usuarios:')
  console.log('  Super Admin: admin@appbar.com / admin123')
  console.log('  Bar Admin:   chela@bar.com / chela123')
  console.log('  9 Bar Admins mas: luna@bar.com, voodoo@bar.com, etc. / bar123')
  console.log('')
  console.log('10 Bares con eventos y menu')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
