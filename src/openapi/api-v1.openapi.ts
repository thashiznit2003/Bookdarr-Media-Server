// Minimal OpenAPI spec for the versioned mobile API.
// This is intentionally hand-maintained so we can "freeze" the contract for the iPhone/Android apps.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../../package.json');

export function getApiV1OpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Bookdarr Media Server (BMS) API',
      version: String(appVersion ?? '0.0.0'),
      description:
        'Mobile API contract. Endpoints under /api/v1 are stable; breaking changes require /api/v2.',
    },
    servers: [
      {
        url: 'https://{host}',
        variables: {
          host: {
            default: 'bms.example.com',
            description: 'Your BMS hostname (reverse-proxied with HTTPS).',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthTokens: {
          type: 'object',
          required: ['accessToken', 'refreshToken', 'tokenType'],
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            tokenType: { type: 'string', enum: ['Bearer'] },
          },
        },
        TwoFactorChallenge: {
          type: 'object',
          required: ['twoFactorRequired', 'challengeToken'],
          properties: {
            twoFactorRequired: { type: 'boolean', enum: [true] },
            challengeToken: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          required: ['user', 'tokens'],
          properties: {
            user: { type: 'object', additionalProperties: true },
            tokens: { $ref: '#/components/schemas/AuthTokens' },
          },
        },
        LibraryItem: {
          type: 'object',
          description:
            'Library item (Book Pool / My Library). BMS may add fields over time; clients must ignore unknown fields.',
          additionalProperties: true,
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            author: { type: 'string' },
            coverUrl: { type: 'string' },
            hasEbook: { type: 'boolean' },
            hasAudiobook: { type: 'boolean' },
            inMyLibrary: { type: 'boolean' },
            checkedOutByMe: { type: 'boolean' },
            readByMe: { type: 'boolean' },
          },
        },
        OfflineManifest: {
          type: 'object',
          required: ['bookId', 'files'],
          properties: {
            bookId: { type: 'integer' },
            files: {
              type: 'array',
              items: {
                type: 'object',
                required: ['fileId', 'url', 'bytesTotal', 'mediaType', 'contentType', 'fileName'],
                properties: {
                  fileId: { type: 'integer' },
                  url: { type: 'string' },
                  fileName: { type: 'string' },
                  mediaType: { type: 'string', enum: ['ebook', 'audiobook', 'unknown'] },
                  bytesTotal: { type: 'integer' },
                  size: {
                    type: 'integer',
                    description: 'Alias of bytesTotal (bytes).',
                  },
                  contentType: { type: 'string' },
                  sha256: {
                    type: ['string', 'null'],
                    description:
                      'Hex-encoded SHA-256 of the cached server copy (when available). Clients should treat null as unknown and compute their own hash after download if desired.',
                  },
                },
              },
            },
          },
        },
      },
      examples: {
        LoginResponse: {
          value: {
            user: {
              id: 'uuid',
              username: 'reader',
              email: 'reader@example.com',
              isAdmin: false,
              twoFactorEnabled: false,
            },
            tokens: {
              tokenType: 'Bearer',
              accessToken: '<jwt>',
              refreshToken: '<jwt>',
            },
          },
        },
        OfflineManifest: {
          value: {
            bookId: 1,
            files: [
              {
                fileId: 10,
                url: '/api/v1/library/files/10/stream/Test%20Book.epub',
                fileName: 'Test Book.epub',
                mediaType: 'ebook',
                bytesTotal: 123456,
                size: 123456,
                contentType: 'application/epub+zip',
                sha256: null,
              },
            ],
          },
        },
      },
    },
    paths: {
      '/api/v1/openapi.json': {
        get: {
          summary: 'OpenAPI spec for the mobile API',
          responses: {
            200: { description: 'OK' },
          },
        },
      },

      '/api/v1/auth/login': {
        post: {
          summary: 'Login (step 1)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Login OK',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                  examples: { ok: { $ref: '#/components/examples/LoginResponse' } },
                },
              },
            },
            401: {
              description: '2FA required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TwoFactorChallenge' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/login/2fa': {
        post: {
          summary: 'Login (step 2, TOTP/backup code)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['otp', 'challengeToken'],
                  properties: {
                    otp: { type: 'string' },
                    challengeToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Login OK',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/refresh': {
        post: {
          summary: 'Refresh access/refresh tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Tokens refreshed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },

      '/api/v1/auth/logout': {
        post: {
          summary: 'Logout (revoke refresh token)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Logged out' } },
        },
      },

      '/api/v1/me': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get current user',
          responses: { 200: { description: 'OK' } },
        },
        put: {
          security: [{ bearerAuth: [] }],
          summary: 'Update profile',
          responses: { 200: { description: 'OK' } },
        },
      },

      '/api/v1/library': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get Book Pool library',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/LibraryItem' } },
                },
              },
            },
          },
        },
      },
      '/api/v1/library/refresh': {
        post: {
          security: [{ bearerAuth: [] }],
          summary: 'Refresh Book Pool from Bookdarr',
          responses: { 201: { description: 'OK' } },
        },
      },
      '/api/v1/library/my': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get My Library (checked out by this user)',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/LibraryItem' } },
                },
              },
            },
          },
        },
      },
      '/api/v1/library/{id}': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get book detail',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/v1/library/{id}/refresh': {
        post: {
          security: [{ bearerAuth: [] }],
          summary: 'Refresh metadata (Bookdarr/OpenLibrary) for one book',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 201: { description: 'OK' } },
        },
      },
      '/api/v1/library/{id}/checkout': {
        post: {
          security: [{ bearerAuth: [] }],
          summary: 'Checkout a book (add to My Library)',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 201: { description: 'OK' } },
        },
      },
      '/api/v1/library/{id}/return': {
        post: {
          security: [{ bearerAuth: [] }],
          summary: 'Return a book (remove from My Library)',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 201: { description: 'OK' } },
        },
      },
      '/api/v1/library/{id}/offline-manifest': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get offline download manifest for a checked-out book',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/OfflineManifest' },
                  examples: { ok: { $ref: '#/components/examples/OfflineManifest' } },
                },
              },
            },
          },
        },
      },
      '/api/v1/library/files/{id}/stream/{name}': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Stream a file (ebook/audiobook) with Range support',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'name', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'OK' }, 206: { description: 'Partial Content' } },
        },
        head: {
          security: [{ bearerAuth: [] }],
          summary: 'HEAD stream (metadata only)',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'name', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'OK' }, 206: { description: 'Partial Content' } },
        },
      },
      '/api/v1/reader/progress/{kind}/{fileId}': {
        get: {
          security: [{ bearerAuth: [] }],
          summary: 'Get reader progress',
          parameters: [
            { name: 'kind', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'fileId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'OK' } },
        },
        post: {
          security: [{ bearerAuth: [] }],
          summary: 'Set reader progress',
          parameters: [
            { name: 'kind', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'fileId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
    },
  };
}
