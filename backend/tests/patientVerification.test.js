const request = require('supertest');
const express = require('express');
const patientController = require('../src/controllers/patientController');

// Mock the external database query
jest.mock('../src/config/externalDatabase', () => ({
    externalQuery: jest.fn()
}));

const { externalQuery } = require('../src/config/externalDatabase');

const app = express();
app.use(express.json());
// Mock auth middleware for testing
app.use((req, res, next) => {
    req.user = { id: 1 };
    next();
});
app.post('/verify-secure', patientController.verifyPatientSecure);

describe('POST /api/patients/verify-secure', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if missing parameters', async () => {
        const res = await request(app)
            .post('/verify-secure') // Use the correct endpoint
            .send({
                registrationNumber: 'REG123'
                // Missing parameters
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return patient data if Reg Number and DOB match', async () => {
        // Mock external query response
        externalQuery.mockResolvedValueOnce({
            rows: [{
                id: 1,
                fullname: JSON.stringify({ first_name: 'John', last_name: 'Doe' }),
                dob: '2020-01-01',
                birth_cert: 'BC12345',
                registration_number: 'REG123',
                gender_id: 1
            }]
        });

        const res = await request(app)
            .post('/verify-secure') // Use the correct endpoint
            .send({
                registrationNumber: 'REG123',
                dateOfBirth: '2020-01-01'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.patient).toBeDefined();
        expect(res.body.patient.registrationNumber).toBe('REG123');
    });

    it('should return 404 if Registration Number not found', async () => {
        externalQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/verify-secure') // Use the correct endpoint
            .send({
                registrationNumber: 'INVALID',
                dateOfBirth: '2020-01-01'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Patient not found or details do not match');
    });

    it('should return 404 if DOB does not match', async () => {
        externalQuery.mockResolvedValueOnce({
            rows: [{
                id: 1,
                fullname: JSON.stringify({ first_name: 'John', last_name: 'Doe' }),
                dob: '2020-01-01', // DB DOB
                registration_number: 'REG123'
            }]
        });

        const res = await request(app)
            .post('/verify-secure') // Use the correct endpoint
            .send({
                registrationNumber: 'REG123',
                dateOfBirth: '2022-05-05' // WRONG DOB
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Patient not found or details do not match');
    });
});
