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

describe('POST /verify-secure', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if missing parameters', async () => {
        const res = await request(app)
            .post('/verify-secure')
            .send({ firstName: 'John' }); // Missing other fields

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('All 5 parameters are required for verification');
    });

    it('should return patient data if First and Last name match', async () => {
        const mockChild = {
            id: 1,
            fullname: JSON.stringify({ first_name: 'John', middle_name: 'Paul', last_name: 'Doe' }),
            dob: '2020-01-01',
            registration_number: 'REG123',
            birth_cert: 'BC123',
            gender: 'Male'
        };

        externalQuery.mockResolvedValueOnce({ rows: [mockChild] });

        const res = await request(app)
            .post('/verify-secure')
            .send({
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2020-01-01',
                registrationNumber: 'REG123',
                birthCertificateNumber: 'BC123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.patient.registrationNumber).toBe('REG123');
    });

    it('should return patient data if First and Middle name match', async () => {
        const mockChild = {
            id: 1,
            fullname: JSON.stringify({ first_name: 'John', middle_name: 'Paul', last_name: 'Doe' }),
            dob: '2020-01-01',
            registration_number: 'REG123',
            birth_cert: 'BC123',
            gender: 'Male'
        };

        externalQuery.mockResolvedValueOnce({ rows: [mockChild] });

        const res = await request(app)
            .post('/verify-secure')
            .send({
                firstName: 'John',
                lastName: 'Paul', // Checking First + Middle
                dateOfBirth: '2020-01-01',
                registrationNumber: 'REG123',
                birthCertificateNumber: 'BC123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.patient.registrationNumber).toBe('REG123');
    });

    it('should return 404 if one name part is incorrect', async () => {
        const mockChild = {
            id: 1,
            fullname: JSON.stringify({ first_name: 'John', middle_name: 'Paul', last_name: 'Doe' }),
            dob: '2020-01-01',
            registration_number: 'REG123',
            birth_cert: 'BC123',
            gender: 'Male'
        };

        externalQuery.mockResolvedValueOnce({ rows: [mockChild] });

        const res = await request(app)
            .post('/verify-secure')
            .send({
                firstName: 'John',
                lastName: 'Wrong', // Incorrect name
                dateOfBirth: '2020-01-01',
                registrationNumber: 'REG123',
                birthCertificateNumber: 'BC123'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Patient not found or details do not match');
    });

    it('should return 404 if patient not found', async () => {
        externalQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/verify-secure')
            .send({
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2020-01-01',
                registrationNumber: 'REG123',
                birthCertificateNumber: 'BC123'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Patient not found or details do not match');
    });

    it('should return 404 if details mismatch (e.g. Birth Cert)', async () => {
        const mockChild = {
            id: 1,
            fullname: JSON.stringify({ first_name: 'John', last_name: 'Doe' }),
            dob: '2020-01-01',
            registration_number: 'REG123',
            birth_cert: 'BC999', // Database has BC999
            gender: 'Male'
        };

        // Code uses fetching by RegNum then checking fields manually
        externalQuery.mockResolvedValueOnce({ rows: [mockChild] });

        const res = await request(app)
            .post('/verify-secure')
            .send({
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2020-01-01',
                registrationNumber: 'REG123',
                birthCertificateNumber: 'BC123' // Request sends BC123 (mismatch)
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Patient not found or details do not match');
    });
});
