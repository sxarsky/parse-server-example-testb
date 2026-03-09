import { Router, Request, Response, NextFunction } from 'express';

/**
 * @openapi
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         objectId:
 *           type: string
 *           readOnly: true
 *           description: Unique identifier assigned by the server
 *         name:
 *           type: string
 *           description: Name of the item
 *         description:
 *           type: string
 *           description: Optional description of the item
 *         price:
 *           type: number
 *           description: Price of the item
 *         quantity:
 *           type: integer
 *           default: 0
 *           description: Available quantity
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *     ItemInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: integer
 *           default: 0
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

interface ItemInput {
  name: string;
  description?: string;
  price?: number;
  quantity?: number;
}

function validateItemInput(
  body: unknown,
  requireName = true,
): { valid: true; data: ItemInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const data = body as Record<string, unknown>;

  if (requireName && (typeof data.name !== 'string' || data.name.trim() === '')) {
    return { valid: false, error: '"name" is required and must be a non-empty string' };
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    return { valid: false, error: '"name" must be a non-empty string' };
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    return { valid: false, error: '"description" must be a string' };
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    return { valid: false, error: '"price" must be a non-negative number' };
  }

  if (
    data.quantity !== undefined &&
    (typeof data.quantity !== 'number' || !Number.isInteger(data.quantity) || data.quantity < 0)
  ) {
    return { valid: false, error: '"quantity" must be a non-negative integer' };
  }

  return {
    valid: true,
    data: {
      name: (data.name as string | undefined)?.trim() as string,
      ...(data.description !== undefined && { description: data.description as string }),
      ...(data.price !== undefined && { price: data.price as number }),
      ...(data.quantity !== undefined && { quantity: data.quantity as number }),
    },
  };
}

/**
 * Token-based authentication middleware.
 * Expects: Authorization: Bearer <token>
 * Token is validated against the ITEMS_API_TOKEN environment variable.
 */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const validToken = process.env.ITEMS_API_TOKEN;

  if (!validToken) {
    res.status(500).json({ error: 'Server authentication is not configured' });
    return;
  }

  if (!token || token !== validToken) {
    res.status(401).json({ error: 'Unauthorized: valid Bearer token required' });
    return;
  }

  next();
}

export const itemsRouter = Router();

/**
 * @openapi
 * /items:
 *   get:
 *     summary: List all items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Array of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
itemsRouter.get('/', async (_req: Request, res: Response) => {
  const query = new Parse.Query('Item');
  const items = await query.find({ useMasterKey: true });
  res.json(items.map(item => item.toJSON()));
});

/**
 * @openapi
 * /items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 */
itemsRouter.get('/:id', async (req: Request, res: Response) => {
  const query = new Parse.Query('Item');
  const item = await query.get(req.params.id, { useMasterKey: true }).catch(() => null);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item.toJSON());
});

/**
 * @openapi
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       201:
 *         description: Created item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
itemsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const validation = validateItemInput(req.body, true);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const Item = Parse.Object.extend('Item');
  const item = new Item();
  item.set('name', validation.data.name);
  if (validation.data.description !== undefined) item.set('description', validation.data.description);
  if (validation.data.price !== undefined) item.set('price', validation.data.price);
  item.set('quantity', validation.data.quantity ?? 0);

  await item.save(null, { useMasterKey: true });
  res.status(201).json(item.toJSON());
});

/**
 * @openapi
 * /items/{id}:
 *   put:
 *     summary: Update an existing item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       200:
 *         description: Updated item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Item not found
 */
itemsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const validation = validateItemInput(req.body, false);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const query = new Parse.Query('Item');
  const item = await query.get(req.params.id, { useMasterKey: true }).catch(() => null);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  if (validation.data.name !== undefined) item.set('name', validation.data.name);
  if (validation.data.description !== undefined) item.set('description', validation.data.description);
  if (validation.data.price !== undefined) item.set('price', validation.data.price);
  if (validation.data.quantity !== undefined) item.set('quantity', validation.data.quantity);

  await item.save(null, { useMasterKey: true });
  res.json(item.toJSON());
});

/**
 * @openapi
 * /items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
itemsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const query = new Parse.Query('Item');
  const item = await query.get(req.params.id, { useMasterKey: true }).catch(() => null);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  await item.destroy({ useMasterKey: true });
  res.status(204).send();
});
