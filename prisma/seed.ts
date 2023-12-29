/* eslint-disable prettier/prettier */
import { PrismaClient, ProductAvailabilityType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function bootstrap() {
  const customer = await prisma.customer.create({
    data: {
      id: '0584ecb3-0960-4341-8d91-36079183cee5',
      onesignal_id: '',
      name: 'Customer Test',
      username: '85988880000',
      password: await hash('123456', 12),
    },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      id: '2cb00a6a-31bc-4b61-8538-ab2ef20d00ed',
      name: 'Restaurant Test',
      maxTables: 10,
      expiresAt: addMonths(Date.now(), 1),

      provider: {
        create: {
          id: 'd3b3c029-d5a8-4729-9bc7-01224a74c92c',
          name: 'Provider Test',
          managers: {
            create: {
              name: 'Provider manager test',
              password: await hash('123456', 12),
              username: 'provider.manager@email.com',
            },
          },
        },
      },

      managers: {
        create: {
          id: 'aae32d2e-8807-4d72-98de-4bceb6e7c386',
          username: 'restaurant@test.com',
          password: await hash('123456', 12),
          name: 'Restaurant Manager Test',
          isOwner: true,
        },
      },

      categories: {
        createMany: {
          data: [
            {
              id: 'b77a13c9-44b2-41a9-854e-b6b1052d58e4',
              name: 'Bebidas',
            },
            {
              id: 'adf80c95-b413-4acb-b1fa-1989b6903d37',
              name: 'Comidas',
            },
          ],
        },
      },

      waiters: {
        create: {
          id: '4490c585-ef54-4cd3-8a90-a3dad345d9e7',
          onesignal_id: '',
          name: 'Waiter Test',
          username: 'waiter@email.com',
          password: await hash('123456', 12),
          tables: {
            create: {
              id: 'ed8e8842-e65a-41f5-8791-30b82cb10239',
              number: 1,
              restaurantId: '2cb00a6a-31bc-4b61-8538-ab2ef20d00ed',
            },
          },
        },
      },
    },

    include: {
      categories: true,
      tables: true,
      waiters: true,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        id: '9dfb4030-bc60-49a4-b0af-da7a096e6976',
        name: 'Suco de Acerola',
        availabilityType: ProductAvailabilityType.QUANTITY,
        availableAmount: 200,
        description:
          'Aliquip id ea culpa irure minim ea id eu excepteur. Est eu occaecat amet occaecat do sunt non. Irure sunt nisi amet excepteur ad consectetur reprehenderit. Sunt ullamco adipisicing veniam est anim tempor minim nulla. Do et irure elit consequat veniam labore. Ullamco mollit adipisicing deserunt esse minim. Ad deserunt consequat fugiat consequat.',
        priceInCents: 300,
        restaurantId: restaurant.id,
        categoryId: restaurant.categories[0].id,
      },
      {
        id: '23a44410-064b-4d97-95ee-5d6e65717f59',
        name: 'Goiabada',
        availabilityType: ProductAvailabilityType.AVAILABILITY,
        isAvailable: true,
        description:
          'Excepteur cupidatat adipisicing adipisicing elit ut non ad nisi irure dolore eu. Eiusmod velit deserunt commodo sint duis qui laboris incididunt eiusmod qui duis cillum adipisicing. Dolor excepteur commodo eiusmod reprehenderit aliquip ipsum irure cillum irure pariatur cupidatat excepteur.',
        priceInCents: 500,
        availableAmount: 200,
        restaurantId: restaurant.id,
        categoryId: restaurant.categories[1].id,
      },
    ],
  });

  await prisma.tableSession.create({
    data: {
      id: 'cb256c69-53db-4bb7-a621-479f676f434b',
      password: '123456',
      status: 'OPENED',
      tableId: restaurant.tables[0].id,
      tableParticipants: {
        create: {
          customerId: customer.id,
          isLeader: true,
        },
      },
    },
  });
}

bootstrap();
