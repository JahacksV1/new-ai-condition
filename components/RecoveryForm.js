import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Typography,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Alert,
  Container,
  Paper
} from '@mui/material';

const steps = [
  'Personal Info',
  'Platform Details',
  'Account Restriction Info',
  'Timeline / Communication',
  'Financial Impact',
  'Transaction Details',
  'Document Uploads',
  'Affidavit Facts',
  'Verification',
  'Submit'
];

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  business: '',
  // add other fields here...
};

export default function RecoveryForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/createDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Document created:', data);

      setShowSuccess(true);
      setFormData(initialFormData);

      setTimeout(() => {
        router.push('/success');
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField fullWidth required margin="normal" label="Full Legal Name" name="fullName" value={formData.fullName} onChange={handleChange} />
            <TextField fullWidth required margin="normal" label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
            <TextField fullWidth margin="normal" label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <TextField fullWidth margin="normal" label="Street Address" name="street" value={formData.street} onChange={handleChange} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth margin="normal" label="City" name="city" value={formData.city} onChange={handleChange} />
              <TextField fullWidth margin="normal" label="State" name="state" value={formData.state} onChange={handleChange} />
              <TextField fullWidth margin="normal" label="ZIP Code" name="zip" value={formData.zip} onChange={handleChange} />
            </Box>
            <TextField fullWidth margin="normal" label="Business Name (if applicable)" name="business" value={formData.business} onChange={handleChange} />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Name of Platform (e.g. Chase, Binance)"
              name="platformName"
              value={formData.platformName || ''}
              onChange={handleChange}
            />
            <TextField
              select
              fullWidth
              required
              margin="normal"
              label="Platform Type"
              name="platformType"
              value={formData.platformType || ''}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="">Select</option>
              <option value="Bank">Bank</option>
              <option value="Crypto Exchange">Crypto Exchange</option>
              <option value="Payment App">Payment App</option>
              <option value="Other">Other</option>
            </TextField>
            <TextField
              select
              fullWidth
              required
              margin="normal"
              label="Account Type"
              name="accountType"
              value={formData.accountType || ''}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="">Select</option>
              <option value="Personal">Personal</option>
              <option value="Business">Business</option>
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label="Account Number or Username"
              name="accountNumber"
              value={formData.accountNumber || ''}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date the Issue Began"
              name="issueStartDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.issueStartDate || ''}
              onChange={handleChange}
            />
          </>
        );
      case 2:
        return (
          <>
            <TextField
              select
              fullWidth
              required
              margin="normal"
              label="Type of Account Restriction"
              name="restrictionType"
              value={formData.restrictionType || ''}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="">Select</option>
              <option value="Frozen">Frozen</option>
              <option value="Locked">Locked</option>
              <option value="Restricted">Restricted</option>
              <option value="Terminated">Terminated</option>
              <option value="Other">Other</option>
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              label="Brief Description of the Issue"
              name="issueDescription"
              multiline
              rows={3}
              value={formData.issueDescription || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Reason Given by Platform (if any)"
              name="platformReason"
              multiline
              rows={2}
              value={formData.platformReason || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Amount of Money Involved (if known)"
              name="amountHeld"
              type="number"
              value={formData.amountHeld || ''}
              onChange={handleChange}
            />
          </>
        );
      case 3:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Date You First Noticed the Issue"
              name="firstNoticeDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.firstNoticeDate || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Have You Contacted the Platform? If Yes, Explain."
              name="contactAttempts"
              multiline
              rows={3}
              value={formData.contactAttempts || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Have You Submitted Any Documents?"
              name="submittedDocuments"
              multiline
              rows={2}
              placeholder="e.g., ID, SSN, bank statements"
              value={formData.submittedDocuments || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Did the Platform Give a Timeline or Follow-Up Response?"
              name="platformResponse"
              multiline
              rows={2}
              value={formData.platformResponse || ''}
              onChange={handleChange}
            />
          </>
        );
      case 4:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="How Has This Affected You Financially?"
              name="financialImpact"
              multiline
              rows={3}
              placeholder="e.g., bills unpaid, loss of revenue, delayed payments"
              value={formData.financialImpact || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Has This Affected You Personally or Emotionally?"
              name="emotionalImpact"
              multiline
              rows={3}
              placeholder="Optional, but helpful for tone and urgency"
              value={formData.emotionalImpact || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Is This Interfering With Your Job or Business?"
              name="businessImpact"
              multiline
              rows={3}
              value={formData.businessImpact || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Estimated Damages or Reimbursement Sought"
              name="compensationAmount"
              type="number"
              placeholder="Optional: e.g., 5000"
              value={formData.compensationAmount || ''}
              onChange={handleChange}
            />
          </>
        );
      case 5:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Was a Specific Transaction Blocked, Reversed, or Withheld?"
              name="transactionIssue"
              multiline
              rows={2}
              value={formData.transactionIssue || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Transaction Amount (if known)"
              name="transactionAmount"
              type="number"
              value={formData.transactionAmount || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Date of Transaction"
              name="transactionDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.transactionDate || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Recipient or Description of Transaction"
              name="transactionRecipient"
              value={formData.transactionRecipient || ''}
              onChange={handleChange}
            />
          </>
        );
      case 6:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="What Documents Have You Already Provided to the Platform?"
              name="documentsProvided"
              multiline
              rows={3}
              placeholder="e.g., ID, proof of address, utility bill, tax return"
              value={formData.documentsProvided || ''}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Do You Believe These Documents Were Reviewed?"
              name="docReviewOpinion"
              multiline
              rows={2}
              placeholder="e.g., I never got a reply. / They said nothing matched."
              value={formData.docReviewOpinion || ''}
              onChange={handleChange}
            />

            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              Upload Supporting File (optional)
              <input
                type="file"
                name="uploadedDocument"
                onChange={handleChange}
                hidden
              />
            </Button>
          </>
        );
      case 7:
        return (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please describe the sequence of events that led to your account issue. Include anything you think is important.
            </Typography>

            <TextField
              fullWidth
              required
              margin="normal"
              label="Your Full Explanation (Affidavit Facts)"
              name="affidavitStatement"
              multiline
              rows={6}
              placeholder="Explain everything that happened in your own words..."
              value={formData.affidavitStatement || ''}
              onChange={handleChange}
            />
          </>
        );
      case 8:
        return (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please review the statement below and type your full name to confirm your understanding.
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
              I affirm that the information provided in this form is true and correct to the best of my knowledge. I understand that this information will be used by Amir and Jackman at Law to create a sworn affidavit on my behalf.
            </Typography>

            <TextField
              fullWidth
              required
              margin="normal"
              label="Type Your Full Name to Acknowledge"
              name="acknowledgementName"
              value={formData.acknowledgementName || ''}
              onChange={handleChange}
            />
          </>
        );
      case 9:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Final Review
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Please review your answers. When ready, click the <strong>Submit Request</strong> button below.
              Once submitted, you will be redirected to a confirmation page.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Note: By clicking submit, you acknowledge that your responses will be reviewed by Amir and Jackman at Law for the creation of a legal document on your behalf.
            </Typography>
          </>
        );
      default:
        return <Typography>Step {step + 1} content goes here...</Typography>;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Document Recovery Request
        </Typography>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {submitted ? (
          <Typography variant="h6" color="success.main" align="center">
            Submission successful! Thank you.
          </Typography>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button variant="contained" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                  Submit Request
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Your document recovery request has been submitted successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}
