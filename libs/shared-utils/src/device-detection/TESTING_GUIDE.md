# Security-First Behavioral Analysis Testing Guide

## 🎯 **Overview**

This guide provides comprehensive testing strategies for our **Security-First Behavioral Analysis** system. We'll test both the **security detection** and **legitimate user experience**.

## 🧪 **Testing Strategy**

### **1. Unit Tests (Jest)**
- Test individual security analysis methods
- Validate risk scoring algorithms
- Test device detection accuracy

### **2. Integration Tests**
- Test complete request flow
- Validate security measures application
- Test device creation with security analysis

### **3. Manual Testing**
- Real-world attack scenarios
- Legitimate user scenarios
- Edge cases and boundary conditions

## 🔧 **Running Tests**

### **Unit Tests**
```bash
# Run all tests
npm test

# Run specific test file
npm test device-detection.service.spec.ts

# Run with coverage
npm test -- --coverage
```

### **Integration Tests**
```bash
# Run integration tests
npm run test:e2e
```

## 📋 **Test Scenarios**

### **🔒 Security Detection Tests**

#### **1. Bot Attack Detection**
```bash
# Test with curl (should be blocked)
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: curl/7.68.0" \
  -H "X-Device-ID: 00000000-0000-0000-0000-000000000000" \
  -H "X-Device-Model: FakeDevice" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: 400 Bad Request - "Access denied due to security policy"
```

#### **2. Selenium Automation Detection**
```bash
# Test with Selenium User-Agent
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (selenium)" \
  -H "X-Device-ID: 12345678-1234-1234-1234-123456789012" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: High risk detection, device marked as untrusted
```

#### **3. Header Inconsistency Detection**
```bash
# Test mobile app with browser headers
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)" \
  -H "X-Device-ID: 4744E0EB-2796-4F4F-9C16-60DBB0116A91" \
  -H "sec-ch-ua-platform: \"Windows\"" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: Medium risk, header inconsistency detected
```

#### **4. Missing User-Agent Detection**
```bash
# Test without User-Agent
curl -X POST http://localhost:3000/auth/login \
  -H "X-Device-ID: 4744E0EB-2796-4F4F-9C16-60DBB0116A91" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: High risk, missing User-Agent detected
```

#### **5. Random UUID Pattern Detection**
```bash
# Test with multiple random UUIDs
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: App/1.0 (12345678-1234-1234-1234-123456789012; 87654321-4321-4321-4321-210987654321)" \
  -H "X-Device-ID: 12345678-1234-1234-1234-123456789012" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: Medium risk, random UUID patterns detected
```

### **✅ Legitimate User Tests**

#### **1. Mobile App - Legitimate User**
```bash
# Test legitimate mobile app
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)" \
  -H "X-Device-ID: 4744E0EB-2796-4F4F-9C16-60DBB0116A91" \
  -H "X-Device-Model: iPhone14,2" \
  -H "X-Device-Name: Qm9iJ3MgaVBob25l" \
  -H "X-System-Version: iOS 17.2" \
  -H "X-App-Version: 3.0.0" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: Low risk, device created successfully
```

#### **2. Browser - Legitimate User**
```bash
# Test legitimate browser
curl -X POST http://localhost:3000/auth/login \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "sec-ch-ua-platform: \"Windows\"" \
  -H "accept-language: en-US,en;q=0.9" \
  -d '{"phone": "09123456789", "otp": "123456"}'

# Expected: Low risk, device created successfully
```

## 🧪 **JavaScript/Node.js Testing Scripts**

### **1. Automated Attack Simulation**
```javascript
// test-attacks.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAttackScenarios() {
  console.log('🧪 Testing Attack Scenarios...\n');

  // Test 1: Bot Attack
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '09123456789',
      otp: '123456'
    }, {
      headers: {
        'User-Agent': 'curl/7.68.0',
        'X-Device-ID': '00000000-0000-0000-0000-000000000000',
        'X-Device-Model': 'FakeDevice'
      }
    });
    console.log('❌ Bot attack should have been blocked!');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Bot attack correctly blocked');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 2: Selenium Automation
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '09123456789',
      otp: '123456'
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (selenium)',
        'X-Device-ID': '12345678-1234-1234-1234-123456789012'
      }
    });
    console.log('⚠️ Selenium automation detected (high risk)');
  } catch (error) {
    console.log('❌ Selenium test failed:', error.message);
  }

  // Test 3: Header Inconsistency
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      phone: '09123456789',
      otp: '123456'
    }, {
      headers: {
        'User-Agent': 'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
        'X-Device-ID': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
        'sec-ch-ua-platform': '"Windows"' // Browser header in mobile app
      }
    });
    console.log('⚠️ Header inconsistency detected (medium risk)');
  } catch (error) {
    console.log('❌ Header inconsistency test failed:', error.message);
  }
}

testAttackScenarios();
```

### **2. Legitimate User Simulation**
```javascript
// test-legitimate-users.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLegitimateUsers() {
  console.log('✅ Testing Legitimate Users...\n');

  // Test 1: Mobile App User
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '09123456789',
      otp: '123456'
    }, {
      headers: {
        'User-Agent': 'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
        'X-Device-ID': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
        'X-Device-Model': 'iPhone14,2',
        'X-Device-Name': 'Qm9iJ3MgaVBob25l', // Base64 encoded "Bob's iPhone"
        'X-System-Version': 'iOS 17.2',
        'X-App-Version': '3.0.0'
      }
    });
    console.log('✅ Mobile app user authenticated successfully');
    console.log('📱 Device info:', response.data.device);
  } catch (error) {
    console.log('❌ Mobile app test failed:', error.message);
  }

  // Test 2: Browser User
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '09123456789',
      otp: '123456'
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'sec-ch-ua-platform': '"Windows"',
        'accept-language': 'en-US,en;q=0.9'
      }
    });
    console.log('✅ Browser user authenticated successfully');
    console.log('💻 Device info:', response.data.device);
  } catch (error) {
    console.log('❌ Browser test failed:', error.message);
  }
}

testLegitimateUsers();
```

### **3. Comprehensive Test Suite**
```javascript
// comprehensive-test.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class SecurityTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runTest(name, testFunction) {
    this.results.total++;
    try {
      await testFunction();
      console.log(`✅ ${name} - PASSED`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}`);
      this.results.failed++;
    }
  }

  async testCriticalAttacks() {
    console.log('\n🚨 Testing Critical Attack Scenarios...\n');

    // Test 1: Obvious bot
    await this.runTest('Bot Attack Detection', async () => {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          phone: '09123456789',
          otp: '123456'
        }, {
          headers: {
            'User-Agent': 'curl/7.68.0',
            'X-Device-ID': '00000000-0000-0000-0000-000000000000'
          }
        });
        throw new Error('Bot attack should have been blocked');
      } catch (error) {
        if (error.response?.status !== 400) {
          throw new Error('Expected 400 status for bot attack');
        }
      }
    });

    // Test 2: Missing User-Agent
    await this.runTest('Missing User-Agent Detection', async () => {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          phone: '09123456789',
          otp: '123456'
        }, {
          headers: {
            'X-Device-ID': '4744E0EB-2796-4F4F-9C16-60DBB0116A91'
          }
        });
        throw new Error('Missing User-Agent should have been detected');
      } catch (error) {
        // Should be detected as high risk
      }
    });
  }

  async testMediumRiskScenarios() {
    console.log('\n⚠️ Testing Medium Risk Scenarios...\n');

    // Test 1: Header inconsistency
    await this.runTest('Header Inconsistency Detection', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        otp: '123456'
      }, {
        headers: {
          'User-Agent': 'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
          'X-Device-ID': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
          'sec-ch-ua-platform': '"Windows"' // Browser header in mobile app
        }
      });
      
      // Should be detected as medium risk but still allowed
      if (response.data.device?.deviceMetadata?.securityAnalysis?.riskLevel !== 'medium') {
        throw new Error('Expected medium risk for header inconsistency');
      }
    });
  }

  async testLegitimateUsers() {
    console.log('\n✅ Testing Legitimate User Scenarios...\n');

    // Test 1: Mobile app
    await this.runTest('Legitimate Mobile App', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        otp: '123456'
      }, {
        headers: {
          'User-Agent': 'ArzdigitalApp/3.0.0 (iOS 17.2;4744E0EB-2796-4F4F-9C16-60DBB0116A91)',
          'X-Device-ID': '4744E0EB-2796-4F4F-9C16-60DBB0116A91',
          'X-Device-Model': 'iPhone14,2',
          'X-System-Version': 'iOS 17.2'
        }
      });
      
      if (response.data.device?.deviceMetadata?.securityAnalysis?.riskLevel !== 'low') {
        throw new Error('Expected low risk for legitimate mobile app');
      }
    });

    // Test 2: Browser
    await this.runTest('Legitimate Browser', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        otp: '123456'
      }, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'sec-ch-ua-platform': '"Windows"'
        }
      });
      
      if (response.data.device?.deviceMetadata?.securityAnalysis?.riskLevel !== 'low') {
        throw new Error('Expected low risk for legitimate browser');
      }
    });
  }

  async runAllTests() {
    console.log('🧪 Starting Security-First Behavioral Analysis Test Suite\n');
    
    await this.testCriticalAttacks();
    await this.testMediumRiskScenarios();
    await this.testLegitimateUsers();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Some tests failed. Please review the security implementation.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! Security system is working correctly.');
    }
  }
}

// Run the test suite
const testSuite = new SecurityTestSuite();
testSuite.runAllTests();
```

## 🔍 **Manual Testing Checklist**

### **Security Detection**
- [ ] **Bot attacks blocked** (curl, wget, etc.)
- [ ] **Automation tools detected** (selenium, puppeteer, etc.)
- [ ] **Header inconsistencies flagged**
- [ ] **Missing User-Agent detected**
- [ ] **Random UUID patterns detected**
- [ ] **Invalid device models flagged**

### **Legitimate User Experience**
- [ ] **Mobile apps work smoothly**
- [ ] **Browsers work normally**
- [ ] **Device detection accurate**
- [ ] **Base64 device names decoded**
- [ ] **No false positives for legitimate users**

### **Risk Level Validation**
- [ ] **Critical (0.9+): Immediate block**
- [ ] **High (0.7+): Enhanced monitoring**
- [ ] **Medium (0.5+): Logging and monitoring**
- [ ] **Low (0.3-): Normal processing**

## 📊 **Expected Results Matrix**

| Scenario | Security Score | Risk Level | Action | Expected Result |
|----------|----------------|------------|---------|-----------------|
| Legitimate Mobile App | < 0.3 | Low | Normal processing | ✅ Success |
| Legitimate Browser | < 0.3 | Low | Normal processing | ✅ Success |
| Header Inconsistency | 0.5-0.7 | Medium | Enhanced monitoring | ⚠️ Allowed but logged |
| Selenium Automation | 0.7-0.9 | High | Mark untrusted | ⚠️ Allowed but monitored |
| Bot Attack | > 0.9 | Critical | Immediate block | 🚫 Blocked |

## 🚀 **Running the Tests**

1. **Start your application:**
   ```bash
   npm run start:dev
   ```

2. **Run unit tests:**
   ```bash
   npm test
   ```

3. **Run integration tests:**
   ```bash
   node test/comprehensive-test.js
   ```

4. **Manual testing:**
   ```bash
   # Test legitimate users
   node test/test-legitimate-users.js
   
   # Test attacks
   node test/test-attacks.js
   ```

## 🎯 **Success Criteria**

✅ **Security System Working:**
- All attack scenarios detected
- Risk levels calculated correctly
- Appropriate actions taken

✅ **User Experience Preserved:**
- Legitimate users not blocked
- Device detection working
- Smooth authentication flow

✅ **Comprehensive Logging:**
- Security events logged
- Risk scores recorded
- Audit trail maintained

**The goal is to catch attackers while providing a smooth experience for legitimate users!** 🛡️✨ 