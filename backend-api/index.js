const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Organization } = require('./models');
const app = express();

app.use(express.json());

const JWT_SECRET = '8z<I10*408f+mX$)4vf0prR&THtW~R';

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// User Registration
app.post('/auth/register', async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            userId: Date.now().toString(),
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone
        });
        const org = await Organization.create({
            orgId: Date.now().toString(),
            name: `${firstName}'s Organisation`,
            userId: user.id
        });
        const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                accessToken: token,
                user: {
                    userId: user.userId,
                    firstName,
                    lastName,
                    email,
                    phone
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Registration unsuccessful',
            statusCode: 400,
            error: error.message
        });
    }
});

// User Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: 'Bad request',
                message: 'Authentication failed',
                statusCode: 401
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'Bad request',
                message: 'Authentication failed',
                statusCode: 401
            });
        }

        const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                accessToken: token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Authentication failed',
            statusCode: 400,
            error: error.message
        });
    }
});

// Get User Record
app.get('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findOne({ where: { userId : req.params.id } });
        if (!user) {
            return res.status(404).json({
                status: 'Not found',
                message: 'User not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User found',
            data: {
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Could not fetch user',
            statusCode: 400,
            error: error.message
        });
    }
});

// Get All Organizations Endpoint
app.get('/api/organisations', authenticateJWT, async (req, res) => {
  try {
    const organizations = await Organization.findAll({ where: { userId: req.user.userId } });
    res.status(200).json({
      status: 'success',
      message: 'Organizations fetched successfully',
      data: {
        organisations: organizations.map(org => ({
          orgId: org.orgId,
          name: org.name,
          description: org.description,
        })),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not fetch organizations',
      statusCode: 400,
      error: error.message,
    });
  }
});

// Get Single Organization Endpoint
app.get('/api/organisations/:orgId', authenticateJWT, async (req, res) => {
  try {
    const organization = await Organization.findOne({ where: { orgId: req.params.orgId, userId: req.user.userId } });
    if (!organization) {
      return res.status(404).json({
        status: 'Not found',
        message: 'Organization not found',
        statusCode: 404,
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Organization fetched successfully',
      data: {
        orgId: organization.orgId,
        name: organization.name,
        description: organization.description,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not fetch organization',
      statusCode: 400,
      error: error.message,
    });
  }
});

// Create Organization Endpoint
app.post('/api/organisations', [
  authenticateJWT,
  body('name').notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  try {
    const orgId = Date.now().toString();
    const organization = await Organization.create({ orgId, name, description, userId: req.user.userId });
    res.status(201).json({
      status: 'success',
      message: 'Organization created successfully',
      data: {
        orgId: organization.orgId,
        name: organization.name,
        description: organization.description,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Client error',
      statusCode: 400,
      error: error.message,
    });
  }
});

// Add User to Organization Endpoint
app.post('/api/organisations/:orgId/users', [
  authenticateJWT,
  body('userId').notEmpty().withMessage('User ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { userId } = req.body;
  const { orgId } = req.params;

  try {
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({
        status: 'Not found',
        message: 'User not found',
        statusCode: 404,
      });
    }

    const organization = await Organization.findOne({ where: { orgId } });
    if (!organization) {
      return res.status(404).json({
        status: 'Not found',
        message: 'Organization not found',
        statusCode: 404,
      });
    }

    organization.userId = user.userId;
    await organization.save();

    res.status(200).json({
      status: 'success',
      message: 'User added to organization successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Could not add user to organization',
      statusCode: 400,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
