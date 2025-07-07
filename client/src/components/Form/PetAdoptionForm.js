// =============================================================================
// PetAdoptionForm.js - Complete Multi-Step Pet Adoption Application Form
// Comprehensive adoption application with validation and file uploads
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Import our form components
import {
  Form,
  FormRow,
  FormCol,
  CompleteField,
  FormField,
  Label,
  Textarea,
  Select,
  RadioGroup,
  Checkbox,
  FileInput,
  FormActions,
  HelpText
} from '../components/Form';

const PetAdoptionForm = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pet, setPet] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const totalSteps = 4;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('intendedPath', `/pets/${petId}/adopt`);
      navigate('/login');
    }
  }, [user, navigate, petId]);

  // Load pet data
  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/pets/${petId}`);
        if (response.data.success) {
          setPet(response.data.data);
        } else {
          setError('Pet not found');
        }
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError('Unable to load pet information');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  // Form validation for each step
  const stepValidations = {
    1: {
      firstName: { 
        required: 'First name is required', 
        minLength: 2,
        maxLength: 50 
      },
      lastName: { 
        required: 'Last name is required', 
        minLength: 2,
        maxLength: 50 
      },
      email: { 
        required: 'Email is required',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Please enter a valid email address'
      },
      phone: { 
        required: 'Phone number is required',
        pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
        patternMessage: 'Please use format: (555) 123-4567'
      },
      address: { 
        required: 'Address is required',
        minLength: 5 
      },
      city: { 
        required: 'City is required',
        minLength: 2 
      },
      state: { 
        required: 'State is required' 
      },
      zipCode: { 
        required: 'ZIP code is required',
        pattern: /^\d{5}(-\d{4})?$/,
        patternMessage: 'Please enter a valid ZIP code'
      },
      dateOfBirth: {
        required: 'Date of birth is required',
        custom: (value) => {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) return 'You must be 18 or older to adopt';
          if (age > 100) return 'Please enter a valid date of birth';
          return null;
        }
      }
    },
    2: {
      housingType: { 
        required: 'Please select your housing type' 
      },
      ownRent: { 
        required: 'Please specify if you own or rent' 
      },
      landlordPermission: {
        custom: (value, data) => {
          if (data.ownRent === 'rent' && !value) {
            return 'Landlord permission is required for renters';
          }
          return null;
        }
      },
      yardType: { 
        required: 'Please select your yard type' 
      },
      hasOtherPets: { 
        required: 'Please specify if you have other pets' 
      },
      householdSize: { 
        required: 'Household size is required',
        custom: (value) => {
          const size = parseInt(value);
          if (size < 1) return 'Household must have at least 1 person';
          if (size > 20) return 'Please enter a reasonable household size';
          return null;
        }
      },
      monthlyIncome: {
        required: 'Monthly income is required',
        custom: (value) => {
          const income = parseFloat(value);
          if (income < 1000) return 'Minimum monthly income of $1,000 required';
          return null;
        }
      }
    },
    3: {
      experienceLevel: { 
        required: 'Please select your experience level' 
      },
      reasonForAdoption: { 
        required: 'Please tell us why you want to adopt', 
        minLength: 50,
        maxLength: 1000 
      },
      timeCommitment: { 
        required: 'Please specify time commitment' 
      },
      exerciseCommitment: { 
        required: 'Please specify exercise commitment' 
      },
      trainingPlan: { 
        required: 'Please describe your training approach', 
        minLength: 30,
        maxLength: 500 
      },
      veterinarianName: { 
        required: 'Veterinarian name is required (enter "None" if you don\'t have one)' 
      },
      veterinarianPhone: { 
        required: 'Veterinarian phone is required (enter "N/A" if you don\'t have one)' 
      },
      petAllergies: {
        required: 'Please specify if anyone has pet allergies'
      }
    },
    4: {
      emergencyContactName: { 
        required: 'Emergency contact name is required',
        minLength: 2 
      },
      emergencyContactPhone: { 
        required: 'Emergency contact phone is required',
        pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
        patternMessage: 'Please use format: (555) 123-4567'
      },
      emergencyContactRelation: { 
        required: 'Emergency contact relationship is required' 
      },
      agreement: { 
        required: 'You must agree to the terms',
        custom: (value) => {
          if (!value) return 'Please agree to the adoption terms';
          return null;
        }
      },
      homeVisitAgreement: {
        required: 'You must agree to the home visit',
        custom: (value) => {
          if (!value) return 'Please agree to allow a home visit';
          return null;
        }
      }
    }
  };

  // Options for select fields
  const stateOptions = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  const housingOptions = [
    { value: 'house', label: 'Single Family House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'mobile', label: 'Mobile Home' },
    { value: 'other', label: 'Other' }
  ];

  const yardOptions = [
    { value: 'large-fenced', label: 'Large Fenced Yard (1/4 acre+)' },
    { value: 'medium-fenced', label: 'Medium Fenced Yard' },
    { value: 'small-fenced', label: 'Small Fenced Yard' },
    { value: 'large-unfenced', label: 'Large Unfenced Yard' },
    { value: 'small-unfenced', label: 'Small Unfenced Yard' },
    { value: 'no-yard', label: 'No Yard/Balcony Only' }
  ];

  const experienceOptions = [
    { value: 'first-time', label: 'First-time pet owner' },
    { value: 'some', label: 'Some experience with pets' },
    { value: 'experienced', label: 'Very experienced with pets' },
    { value: 'professional', label: 'Professional experience (vet, trainer, breeder)' }
  ];

  const timeCommitmentOptions = [
    { value: '1-2-hours', label: '1-2 hours per day' },
    { value: '3-4-hours', label: '3-4 hours per day' },
    { value: '5-6-hours', label: '5-6 hours per day' },
    { value: 'most-day', label: 'Most of the day' },
    { value: 'full-time', label: 'Full-time (work from home/retired)' }
  ];

  const exerciseOptions = [
    { value: 'minimal', label: 'Minimal (indoor play only)' },
    { value: 'light', label: 'Light (short walks, basic play)' },
    { value: 'moderate', label: 'Moderate (daily walks, regular play)' },
    { value: 'active', label: 'Active (running, hiking, dog parks)' },
    { value: 'very-active', label: 'Very Active (multiple daily activities)' }
  ];

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return value;
  };

  // Handle form submission for each step
  const handleStepSubmit = (stepData) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);
    
    if (currentStep === totalSteps) {
      handleFinalSubmit(updatedFormData);
    } else {
      nextStep();
    }
  };

  // Handle final form submission
  const handleFinalSubmit = async (finalData) => {
    setSubmitLoading(true);
    setError('');
    
    try {
      // Prepare form data for submission
      const submissionData = {
        ...finalData,
        petId: petId,
        userId: user.id,
        documents: uploadedFiles
      };

      const response = await api.post(`/pets/${petId}/adopt`, submissionData);
      
      if (response.data.success) {
        setSubmitSuccess(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit application');
      }
      
    } catch (err) {
      console.error('Error submitting adoption application:', err);
      setError(
        err.response?.data?.message || 
        'Error submitting application. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle file uploads
  const handleFileUpload = (files) => {
    setUploadedFiles(files);
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5" style={{ marginTop: '80px' }}>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Body className="text-center p-5">
                <div className="spinner-border text-primary mb-3"></div>
                <p>Loading pet information...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <Container className="py-5" style={{ marginTop: '80px' }}>
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="text-center shadow-lg">
              <Card.Body className="p-5">
                <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
                <h2 className="mb-3">Application Submitted Successfully!</h2>
                <p className="lead mb-4">
                  Thank you for your interest in adopting <strong>{pet?.name}</strong>! 
                  We've received your application and will review it within 2-3 business days.
                </p>
                
                <Alert variant="info" className="mb-4">
                  <h6 className="mb-2">What happens next?</h6>
                  <ul className="list-unstyled mb-0 text-start">
                    <li className="mb-1">📧 You'll receive a confirmation email shortly</li>
                    <li className="mb-1">📞 Our team will contact you within 2-3 business days</li>
                    <li className="mb-1">🏠 We may schedule a home visit if approved</li>
                    <li className="mb-1">🎉 Meet your new companion!</li>
                  </ul>
                </Alert>
                
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-home me-2"></i>
                    Return Home
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/pets')}
                  >
                    <i className="fas fa-paw me-2"></i>
                    Browse More Pets
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/profile')}
                  >
                    <i className="fas fa-user me-2"></i>
                    View Profile
                  </button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Header with Pet Info */}
          {pet && (
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2}>
                    <img 
                      src={pet.imageUrl || pet.image || 'https://via.placeholder.com/150x150?text=Pet+Photo'} 
                      alt={pet.name}
                      className="img-fluid rounded"
                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                    />
                  </Col>
                  <Col md={8}>
                    <h4 className="mb-2">
                      <i className="fas fa-heart text-danger me-2"></i>
                      Adoption Application for {pet.name}
                    </h4>
                    <p className="text-muted mb-2">
                      <Badge bg="info" className="me-2">{pet.type}</Badge>
                      <Badge bg="secondary" className="me-2">{pet.breed}</Badge>
                      <Badge bg="success">{pet.age}</Badge>
                    </p>
                    <p className="small text-muted mb-0">
                      Please complete all steps to submit your adoption application. 
                      All information will be kept confidential.
                    </p>
                  </Col>
                  <Col md={2} className="text-end">
                    <div className="text-muted small mb-2">
                      Step {currentStep} of {totalSteps}
                    </div>
                    <ProgressBar 
                      now={(currentStep / totalSteps) * 100} 
                      variant="primary"
                      className="mb-2"
                    />
                    <small className="text-muted">
                      {Math.round((currentStep / totalSteps) * 100)}% Complete
                    </small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {/* Main Form */}
          <Card className="shadow-lg">
            <Card.Body className="p-4">
              {currentStep === 1 && (
                <StepPersonalInfo 
                  onSubmit={handleStepSubmit}
                  validation={stepValidations[1]}
                  defaultData={formData}
                  stateOptions={stateOptions}
                  formatPhoneNumber={formatPhoneNumber}
                />
              )}
              
              {currentStep === 2 && (
                <StepHousingSituation 
                  onSubmit={handleStepSubmit}
                  onPrevious={prevStep}
                  validation={stepValidations[2]}
                  defaultData={formData}
                  housingOptions={housingOptions}
                  yardOptions={yardOptions}
                />
              )}
              
              {currentStep === 3 && (
                <StepPetExperience 
                  onSubmit={handleStepSubmit}
                  onPrevious={prevStep}
                  validation={stepValidations[3]}
                  defaultData={formData}
                  experienceOptions={experienceOptions}
                  timeCommitmentOptions={timeCommitmentOptions}
                  exerciseOptions={exerciseOptions}
                />
              )}
              
              {currentStep === 4 && (
                <StepFinalDetails 
                  onSubmit={handleStepSubmit}
                  onPrevious={prevStep}
                  validation={stepValidations[4]}
                  defaultData={formData}
                  loading={submitLoading}
                  onFileUpload={handleFileUpload}
                  formatPhoneNumber={formatPhoneNumber}
                  pet={pet}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// =============================================================================
// STEP 1: PERSONAL INFORMATION
// =============================================================================

const StepPersonalInfo = ({ 
  onSubmit, 
  validation, 
  defaultData, 
  stateOptions, 
  formatPhoneNumber 
}) => {
  const [phoneValue, setPhoneValue] = useState(defaultData.phone || '');

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
  };

  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
          <i className="fas fa-user"></i>
        </div>
        <div>
          <h3 className="mb-1">Personal Information</h3>
          <p className="text-muted mb-0">Tell us about yourself</p>
        </div>
      </div>

      <Form onSubmit={onSubmit} validation={validation}>
        <FormRow>
          <FormCol size="half">
            <CompleteField
              label="First Name"
              name="firstName"
              type="text"
              required
              inputProps={{
                defaultValue: defaultData.firstName,
                autoFocus: true,
                placeholder: "John"
              }}
            />
          </FormCol>
          
          <FormCol size="half">
            <CompleteField
              label="Last Name"
              name="lastName"
              type="text"
              required
              inputProps={{
                defaultValue: defaultData.lastName,
                placeholder: "Doe"
              }}
            />
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol size="half">
            <CompleteField
              label="Email Address"
              name="email"
              type="email"
              required
              helpText="We'll use this to contact you about your application"
              inputProps={{
                defaultValue: defaultData.email,
                placeholder: "john@example.com"
              }}
            />
          </FormCol>
          
          <FormCol size="half">
            <CompleteField
              label="Phone Number"
              name="phone"
              type="tel"
              required
              helpText="We may call to schedule a meet-and-greet"
              inputProps={{
                placeholder: "(555) 123-4567",
                value: phoneValue,
                onChange: handlePhoneChange
              }}
            />
          </FormCol>
        </FormRow>

        <CompleteField
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          required
          helpText="You must be 18 or older to adopt"
          inputProps={{
            defaultValue: defaultData.dateOfBirth,
            max: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]
          }}
        />

        <CompleteField
          label="Street Address"
          name="address"
          type="text"
          required
          inputProps={{
            defaultValue: defaultData.address,
            placeholder: "123 Main Street"
          }}
        />

        <FormRow>
          <FormCol size="half">
            <CompleteField
              label="City"
              name="city"
              type="text"
              required
              inputProps={{
                defaultValue: defaultData.city,
                placeholder: "Lexington"
              }}
            />
          </FormCol>
          
          <FormCol size="quarter">
            <FormField required>
              <Label htmlFor="state">State</Label>
              <Select
                id="state"
                name="state"
                placeholder="Select State"
                options={stateOptions}
                defaultValue={defaultData.state}
              />
            </FormField>
          </FormCol>
          
          <FormCol size="quarter">
            <CompleteField
              label="ZIP Code"
              name="zipCode"
              type="text"
              required
              inputProps={{
                defaultValue: defaultData.zipCode,
                placeholder: "40505",
                maxLength: 10
              }}
            />
          </FormCol>
        </FormRow>

        <FormActions alignment="right">
          <button type="submit" className="btn btn-primary">
            Next Step <i className="fas fa-arrow-right ms-1"></i>
          </button>
        </FormActions>
      </Form>
    </>
  );
};

// =============================================================================
// STEP 2: HOUSING SITUATION
// =============================================================================

const StepHousingSituation = ({ 
  onSubmit, 
  onPrevious, 
  validation, 
  defaultData, 
  housingOptions, 
  yardOptions 
}) => {
  const [isRenter, setIsRenter] = useState(defaultData.ownRent === 'rent');
  const [hasOtherPets, setHasOtherPets] = useState(defaultData.hasOtherPets === 'yes');

  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
          <i className="fas fa-home"></i>
        </div>
        <div>
          <h3 className="mb-1">Housing Situation</h3>
          <p className="text-muted mb-0">Tell us about your living environment</p>
        </div>
      </div>

      <Form onSubmit={onSubmit} validation={validation}>
        <FormField required>
          <Label>What type of housing do you live in?</Label>
          <RadioGroup
            name="housingType"
            options={housingOptions}
            value={defaultData.housingType}
          />
        </FormField>

        <FormField required>
          <Label>Do you own or rent your home?</Label>
          <RadioGroup
            name="ownRent"
            options={[
              { value: 'own', label: 'Own' },
              { value: 'rent', label: 'Rent' }
            ]}
            value={defaultData.ownRent}
            onChange={(value) => setIsRenter(value === 'rent')}
            inline
          />
        </FormField>

        {isRenter && (
          <FormField>
            <Checkbox
              id="landlordPermission"
              name="landlordPermission"
              label="I have my landlord's written permission to have a pet"
              defaultChecked={defaultData.landlordPermission}
            />
            <HelpText>
              You may be required to provide written permission from your landlord before adoption.
            </HelpText>
          </FormField>
        )}

        <FormField required>
          <Label>What best describes your yard situation?</Label>
          <RadioGroup
            name="yardType"
            options={yardOptions}
            value={defaultData.yardType}
          />
        </FormField>

        <FormRow>
          <FormCol size="half">
            <FormField required>
              <Label>Do you currently have other pets?</Label>
              <RadioGroup
                name="hasOtherPets"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' }
                ]}
                value={defaultData.hasOtherPets}
                onChange={(value) => setHasOtherPets(value === 'yes')}
                inline
              />
            </FormField>
          </FormCol>
          
          <FormCol size="half">
            <CompleteField
              label="Number of people in household"
              name="householdSize"
              type="number"
              required
              helpText="Including yourself"
              inputProps={{
                min: 1,
                max: 20,
                defaultValue: defaultData.householdSize
              }}
            />
          </FormCol>
        </FormRow>

        {hasOtherPets && (
          <FormField>
            <Label htmlFor="otherPetsDetails">Tell us about your other pets</Label>
            <Textarea
              id="otherPetsDetails"
              name="otherPetsDetails"
              rows={3}
              placeholder="Please describe your other pets (type, age, temperament, spayed/neutered status, etc.)"
              defaultValue={defaultData.otherPetsDetails}
            />
            <HelpText>This helps us ensure compatibility with your new pet</HelpText>
          </FormField>
        )}

        <CompleteField
          label="Monthly Household Income"
          name="monthlyIncome"
          type="number"
          required
          helpText="Pets require ongoing expenses for food, vet care, and supplies"
          inputProps={{
            min: 0,
            step: 100,
            defaultValue: defaultData.monthlyIncome,
            placeholder: "3000"
          }}
        />

        <FormActions alignment="between">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={onPrevious}
          >
            <i className="fas fa-arrow-left me-1"></i> Previous
          </button>
          
          <button type="submit" className="btn btn-primary">
            Next Step <i className="fas fa-arrow-right ms-1"></i>
          </button>
        </FormActions>
      </Form>
    </>
  );
};

// =============================================================================
// STEP 3: PET EXPERIENCE
// =============================================================================

const StepPetExperience = ({ 
  onSubmit, 
  onPrevious, 
  validation, 
  defaultData, 
  experienceOptions, 
  timeCommitmentOptions, 
  exerciseOptions 
}) => {
  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
          <i className="fas fa-paw"></i>
        </div>
        <div>
          <h3 className="mb-1">Pet Experience & Care Plan</h3>
          <p className="text-muted mb-0">Help us understand your pet care experience and plans</p>
        </div>
      </div>

      <Form onSubmit={onSubmit} validation={validation}>
        <FormField required>
          <Label>What is your experience level with pets?</Label>
          <RadioGroup
            name="experienceLevel"
            options={experienceOptions}
            value={defaultData.experienceLevel}
          />
        </FormField>

        <FormField required>
          <Label htmlFor="reasonForAdoption">
            Why do you want to adopt a pet? (minimum 50 characters)
          </Label>
          <Textarea
            id="reasonForAdoption"
            name="reasonForAdoption"
            rows={4}
            placeholder="Tell us about your motivation for adopting and what you hope to provide for your new pet. What role will this pet play in your life?"
            defaultValue={defaultData.reasonForAdoption}
          />
          <HelpText>This helps us understand your commitment and expectations</HelpText>
        </FormField>

        <FormRow>
          <FormCol size="half">
            <FormField required>
              <Label>How much time can you dedicate to your pet daily?</Label>
              <RadioGroup
                name="timeCommitment"
                options={timeCommitmentOptions}
                value={defaultData.timeCommitment}
              />
            </FormField>
          </FormCol>
          
          <FormCol size="half">
            <FormField required>
              <Label>How much exercise can you provide?</Label>
              <RadioGroup
                name="exerciseCommitment"
                options={exerciseOptions}
                value={defaultData.exerciseCommitment}
              />
            </FormField>
          </FormCol>
        </FormRow>

        <FormField required>
          <Label htmlFor="trainingPlan">
            Describe your plan for training and socialization (minimum 30 characters)
          </Label>
          <Textarea
            id="trainingPlan"
            name="trainingPlan"
            rows={3}
            placeholder="How will you handle training, behavior issues, and socialization? Do you plan to use professional trainers?"
            defaultValue={defaultData.trainingPlan}
          />
        </FormField>

        <FormRow>
          <FormCol size="half">
            <CompleteField
              label="Current Veterinarian Name"
              name="veterinarianName"
              type="text"
              required
              helpText="Enter 'None' if you don't currently have a veterinarian"
              inputProps={{
                defaultValue: defaultData.veterinarianName,
                placeholder: "Dr. Smith Animal Hospital or 'None'"
              }}
            />
          </FormCol>
          
          <FormCol size="half">
            <CompleteField
              label="Veterinarian Phone Number"
              name="veterinarianPhone"
              type="tel"
              required
              helpText="Enter 'N/A' if you don't have a veterinarian"
              inputProps={{
                defaultValue: defaultData.veterinarianPhone,
                placeholder: "(555) 123-4567 or 'N/A'"
              }}
            />
          </FormCol>
        </FormRow>

        <FormField required>
          <Label>Does anyone in your household have pet allergies?</Label>
          <RadioGroup
            name="petAllergies"
            options={[
              { value: 'none', label: 'No allergies' },
              { value: 'mild', label: 'Mild allergies (manageable)' },
              { value: 'moderate', label: 'Moderate allergies' },
              { value: 'severe', label: 'Severe allergies' }
            ]}
            value={defaultData.petAllergies}
          />
        </FormField>

        <FormActions alignment="between">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={onPrevious}
          >
            <i className="fas fa-arrow-left me-1"></i> Previous
          </button>
          
          <button type="submit" className="btn btn-primary">
            Next Step <i className="fas fa-arrow-right ms-1"></i>
          </button>
        </FormActions>
      </Form>
    </>
  );
};

// =============================================================================
// STEP 4: FINAL DETAILS
// =============================================================================

const StepFinalDetails = ({ 
  onSubmit, 
  onPrevious, 
  validation, 
  defaultData, 
  loading, 
  onFileUpload, 
  formatPhoneNumber,
  pet 
}) => {
  const [phoneValue, setPhoneValue] = useState(defaultData.emergencyContactPhone || '');

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
    e.target.value = formatted;
  };

  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
          <i className="fas fa-clipboard-check"></i>
        </div>
        <div>
          <h3 className="mb-1">Final Details & Agreement</h3>
          <p className="text-muted mb-0">Almost done! Just a few more details</p>
        </div>
      </div>

      <Form onSubmit={onSubmit} validation={validation}>
        <Alert variant="info" className="mb-4">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Almost done!</strong> We just need emergency contact information and your agreement to our adoption terms.
        </Alert>

        <h5 className="mb-3">
          <i className="fas fa-phone me-2"></i>
          Emergency Contact
        </h5>
        <p className="text-muted mb-3">
          Someone we can contact if we can't reach you about your pet.
        </p>
        
        <FormRow>
          <FormCol size="half">
            <CompleteField
              label="Emergency Contact Name"
              name="emergencyContactName"
              type="text"
              required
              inputProps={{
                defaultValue: defaultData.emergencyContactName,
                placeholder: "Jane Doe"
              }}
            />
          </FormCol>
          
          <FormCol size="half">
            <CompleteField
              label="Emergency Contact Phone"
              name="emergencyContactPhone"
              type="tel"
              required
              inputProps={{
                placeholder: "(555) 123-4567",
                value: phoneValue,
                onChange: handlePhoneChange
              }}
            />
          </FormCol>
        </FormRow>

        <CompleteField
          label="Relationship to Emergency Contact"
          name="emergencyContactRelation"
          type="text"
          required
          helpText="e.g., Parent, Sibling, Friend, Spouse, etc."
          inputProps={{
            defaultValue: defaultData.emergencyContactRelation,
            placeholder: "Parent, Sibling, Friend, etc."
          }}
        />

        <hr className="my-4" />

        <h5 className="mb-3">
          <i className="fas fa-upload me-2"></i>
          Supporting Documents (Optional)
        </h5>
        
        <FormField>
          <Label htmlFor="documents">
            Upload any supporting documents
          </Label>
          <FileInput
            id="documents"
            name="documents"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            onFileChange={onFileUpload}
          />
          <HelpText>
            You may upload references, veterinary records, proof of income, or other supporting documents. 
            Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB each)
          </HelpText>
        </FormField>

        <hr className="my-4" />

        <h5 className="mb-3">
          <i className="fas fa-handshake me-2"></i>
          Adoption Agreement
        </h5>
        
        <div className="border rounded p-3 mb-3" style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
          <h6>Terms and Conditions for Adopting {pet?.name}</h6>
          <p className="small mb-2">
            By submitting this application, I understand and agree to the following:
          </p>
          <ul className="small">
            <li>This application does not guarantee adoption approval</li>
            <li>FurBabies reserves the right to approve or deny any application</li>
            <li>All information provided is true and accurate to the best of my knowledge</li>
            <li>I understand that providing false information may result in application denial</li>
            <li>I agree to a home visit if required as part of the adoption process</li>
            <li>I understand that adoption fees are non-refundable once adoption is finalized</li>
            <li>I agree to provide proper care, nutrition, exercise, and veterinary care for this pet</li>
            <li>I will maintain current vaccinations and provide annual veterinary check-ups</li>
            <li>I will contact FurBabies immediately if I can no longer care for the pet</li>
            <li>I understand that the pet must be returned to FurBabies if I cannot keep them</li>
            <li>I will not sell, give away, or abandon this pet under any circumstances</li>
            <li>I agree to spay/neuter the pet if not already done (within 30 days of adoption)</li>
            <li>I understand this is a lifetime commitment that may span 10-20+ years</li>
          </ul>
        </div>

        <FormField required>
          <Checkbox
            id="agreement"
            name="agreement"
            label="I have read and agree to all terms and conditions listed above"
            defaultChecked={defaultData.agreement}
          />
        </FormField>

        <FormField required className="mb-4">
          <Checkbox
            id="homeVisitAgreement"
            name="homeVisitAgreement"
            label="I agree to allow a home visit by FurBabies staff if requested"
            defaultChecked={defaultData.homeVisitAgreement}
          />
        </FormField>

        <Alert variant="success" className="mb-4">
          <h6 className="mb-2">
            <i className="fas fa-heart me-2"></i>
            Ready to welcome {pet?.name} home?
          </h6>
          <p className="mb-0 small">
            Once you submit this application, our team will review it and contact you within 2-3 business days. 
            Thank you for choosing to adopt and give a loving home to a pet in need!
          </p>
        </Alert>

        <FormActions alignment="between">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={onPrevious}
          >
            <i className="fas fa-arrow-left me-1"></i> Previous
          </button>
          
          <button 
            type="submit" 
            className="btn btn-success btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Submitting Application...
              </>
            ) : (
              <>
                <i className="fas fa-heart me-2"></i>
                Submit Adoption Application
              </>
            )}
          </button>
        </FormActions>
      </Form>
    </>
  );
};

export default PetAdoptionForm;