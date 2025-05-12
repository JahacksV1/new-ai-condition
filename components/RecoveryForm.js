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

// Nested initial shape
const initialFormData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    business: ''
  },
  platformInfo: {
    platformName: '',
    platformType: '',
    accountType: '',
    accountNumber: '',
    issueStartDate: ''
  },
  restrictionInfo: {
    restrictionType: '',
    issueDescription: '',
    platformReason: '',
    amountHeld: ''
  },
  timelineInfo: {
    firstNoticeDate: '',
    contactAttempts: '',
    submittedDocuments: '',
    platformResponse: ''
  },
  financialInfo: {
    financialImpact: '',
    emotionalImpact: '',
    businessImpact: '',
    compensationAmount: ''
  },
  transactionInfo: {
    transactionIssue: '',
    transactionAmount: '',
    transactionDate: '',
    transactionRecipient: ''
  },
  uploadInfo: {
    documentsProvided: '',
    docReviewOpinion: '',
    uploadedDocument: null
  },
  affidavitInfo: {
    affidavitStatement: ''
  },
  verificationInfo: {
    acknowledgementName: ''
  }
};

export default function RecoveryForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handles names like "personalInfo.fullName" or "uploadInfo.uploadedDocument"
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const val = files ? files[0] : value;
    const keys = name.split('.');

    setFormData((prev) => {
      // Deep clone top-level
      const updated = { ...prev };
      let cursor = updated;

      // Walk down, cloning each nested object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        cursor[key] = { ...cursor[key] };
        cursor = cursor[key];
      }

      // Set final field
      cursor[keys[keys.length - 1]] = val;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/createDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('Submission failed:', data);
        return;
      }

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
      // ────────────────────────────
      // 0. Personal Info
      // ────────────────────────────
      case 0:
        return (
          <>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Full Legal Name"
              name="personalInfo.fullName"
              value={formData.personalInfo.fullName}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              margin="normal"
              label="Email Address"
              name="personalInfo.email"
              type="email"
              value={formData.personalInfo.email}
              onChange={handleChange}
              error={!formData.personalInfo.email}
              helperText={!formData.personalInfo.email ? "Email is required" : ""}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Phone Number"
              name="personalInfo.phone"
              value={formData.personalInfo.phone}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Street Address"
              name="personalInfo.street"
              value={formData.personalInfo.street}
              onChange={handleChange}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="City"
                name="personalInfo.city"
                value={formData.personalInfo.city}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="State"
                name="personalInfo.state"
                value={formData.personalInfo.state}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="ZIP Code"
                name="personalInfo.zip"
                value={formData.personalInfo.zip}
                onChange={handleChange}
              />
            </Box>
            <TextField
              fullWidth
              margin="normal"
              label="Business Name (if applicable)"
              name="personalInfo.business"
              value={formData.personalInfo.business}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 1. Platform Details
      // ────────────────────────────
      case 1:
        return (
          <>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Name of Platform (e.g. Chase, Binance)"
              name="platformInfo.platformName"
              value={formData.platformInfo.platformName}
              onChange={handleChange}
            />
            <TextField
              select
              fullWidth
              required
              margin="normal"
              label="Platform Type"
              name="platformInfo.platformType"
              value={formData.platformInfo.platformType}
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
              name="platformInfo.accountType"
              value={formData.platformInfo.accountType}
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
              name="platformInfo.accountNumber"
              value={formData.platformInfo.accountNumber}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date the Issue Began"
              name="platformInfo.issueStartDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.platformInfo.issueStartDate}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 2. Account Restriction Info
      // ────────────────────────────
      case 2:
        return (
          <>
            <TextField
              select
              fullWidth
              required
              margin="normal"
              label="Type of Account Restriction"
              name="restrictionInfo.restrictionType"
              value={formData.restrictionInfo.restrictionType}
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
              name="restrictionInfo.issueDescription"
              multiline
              rows={3}
              value={formData.restrictionInfo.issueDescription}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Reason Given by Platform (if any)"
              name="restrictionInfo.platformReason"
              multiline
              rows={2}
              value={formData.restrictionInfo.platformReason}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Amount of Money Involved (if known)"
              name="restrictionInfo.amountHeld"
              type="number"
              value={formData.restrictionInfo.amountHeld}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 3. Timeline / Communication
      // ────────────────────────────
      case 3:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Date You First Noticed the Issue"
              name="timelineInfo.firstNoticeDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.timelineInfo.firstNoticeDate}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Have You Contacted the Platform? If Yes, Explain."
              name="timelineInfo.contactAttempts"
              multiline
              rows={3}
              value={formData.timelineInfo.contactAttempts}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Have You Submitted Any Documents?"
              name="timelineInfo.submittedDocuments"
              multiline
              rows={2}
              placeholder="e.g., ID, SSN, bank statements"
              value={formData.timelineInfo.submittedDocuments}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Did the Platform Give a Timeline or Follow-Up Response?"
              name="timelineInfo.platformResponse"
              multiline
              rows={2}
              value={formData.timelineInfo.platformResponse}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 4. Financial Impact
      // ────────────────────────────
      case 4:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="How Has This Affected You Financially?"
              name="financialInfo.financialImpact"
              multiline
              rows={3}
              placeholder="e.g., bills unpaid, loss of revenue, delayed payments"
              value={formData.financialInfo.financialImpact}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Has This Affected You Personally or Emotionally?"
              name="financialInfo.emotionalImpact"
              multiline
              rows={3}
              placeholder="Optional, but helpful for tone and urgency"
              value={formData.financialInfo.emotionalImpact}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Is This Interfering With Your Job or Business?"
              name="financialInfo.businessImpact"
              multiline
              rows={3}
              value={formData.financialInfo.businessImpact}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Estimated Damages or Reimbursement Sought"
              name="financialInfo.compensationAmount"
              type="number"
              placeholder="Optional: e.g., 5000"
              value={formData.financialInfo.compensationAmount}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 5. Transaction Details
      // ────────────────────────────
      case 5:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="Was a Specific Transaction Blocked, Reversed, or Withheld?"
              name="transactionInfo.transactionIssue"
              multiline
              rows={2}
              value={formData.transactionInfo.transactionIssue}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Transaction Amount (if known)"
              name="transactionInfo.transactionAmount"
              type="number"
              value={formData.transactionInfo.transactionAmount}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date of Transaction"
              name="transactionInfo.transactionDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.transactionInfo.transactionDate}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Recipient or Description of Transaction"
              name="transactionInfo.transactionRecipient"
              value={formData.transactionInfo.transactionRecipient}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 6. Document Uploads
      // ────────────────────────────
      case 6:
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              label="What Documents Have You Already Provided to the Platform?"
              name="uploadInfo.documentsProvided"
              multiline
              rows={3}
              placeholder="e.g., ID, proof of address, utility bill, tax return"
              value={formData.uploadInfo.documentsProvided}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Do You Believe These Documents Were Reviewed?"
              name="uploadInfo.docReviewOpinion"
              multiline
              rows={2}
              placeholder="e.g., I never got a reply. / They said nothing matched."
              value={formData.uploadInfo.docReviewOpinion}
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
                name="uploadInfo.uploadedDocument"
                onChange={handleChange}
                hidden
              />
            </Button>
          </>
        );
  
      // ────────────────────────────
      // 7. Affidavit Facts
      // ────────────────────────────
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
              name="affidavitInfo.affidavitStatement"
              multiline
              rows={6}
              placeholder="Explain everything that happened in your own words..."
              value={formData.affidavitInfo.affidavitStatement}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 8. Verification Acknowledgement
      // ────────────────────────────
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
              name="verificationInfo.acknowledgementName"
              value={formData.verificationInfo.acknowledgementName}
              onChange={handleChange}
            />
          </>
        );
  
      // ────────────────────────────
      // 9. Final Review & Submit
      // ────────────────────────────
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
        return <Typography>Step {step + 1} content goes here…</Typography>;
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

<Box
  component="form"
  onSubmit={handleSubmit}
  sx={{ mt: 3 }}
>
  {renderStepContent()}

  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      mt: 3
    }}
  >
    <Button
      disabled={step === 0}
      onClick={() => setStep(step - 1)}
    >
      Back
    </Button>

    {step < steps.length - 1 ? (
      <Button
        variant="contained"
        onClick={() => setStep(step + 1)}
      >
        Next
      </Button>
    ) : (
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={submitting}
      >
        Submit Request
      </Button>
    )}
  </Box>
</Box>

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
