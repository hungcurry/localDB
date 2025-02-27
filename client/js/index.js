// GET /users：獲取所有用戶。
// POST /users：創建新用戶，請求體需包含用戶資料。
// PUT /users/:id：更新指定 ID 的用戶，請求體需包含更新的資料。
// DELETE /users/:id：刪除指定 ID 的用戶。
const el = document.querySelector('.use')
const signupForm = document.getElementById('signup-form')
const loginForm = document.getElementById('login-form')
const createForm = document.getElementById('create-form')
const updateForm = document.getElementById('update-form')
const deleteForm = document.getElementById('delete-form')
const signupTab = document.getElementById('signup-tab')
const loginTab = document.getElementById('login-tab')
const loginName = document.getElementById('login-name')
const loginExp = document.getElementById('login-exp')
// ===================
// ... Token ...
// ===================
let token = ''
// Get JwtToken
const handleSignup = async (e) => {
  e.preventDefault()
  const email = document.getElementById('signup-email').value
  const username = document.getElementById('signup-username').value
  const password = document.getElementById('signup-password').value

  try {
    const response = await fetch('http://localhost:3000/api/token/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('註冊成功！', data)
      signupForm.reset()
    } else {
      const errorData = await response.json()
      console.log(`註冊失敗：${errorData.message}`)
    }
  } catch (error) {
    console.error('註冊錯誤：', error)
    console.log('註冊過程中發生錯誤，請稍後再試。')
  }
}
const handleLogin = async (e) => {
  e.preventDefault()
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value

  try {
    const response = await fetch('http://localhost:3000/api/token/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      const responseData = await response.json()
      console.log('登入成功！', responseData)
      loginForm.reset()
      localStorage.setItem('JWT-token', responseData.data)
      // 這裡可以添加登入成功後的操作，比如存儲 token 或重定向
      fetchCheckJwtToken()
    } else {
      const errorData = await response.json()
      console.log(`登入失敗：${errorData.message}`)
    }
  } catch (error) {
    console.error('登入錯誤：', error)
    console.log('登入過程中發生錯誤，請稍後再試。')
  }
}
const fetchCheckJwtToken = async () => {
  token = localStorage.getItem('JWT-token')
  if (!token) token = null; // 如果 token 是空的

  try {
    const response = await fetch('http://localhost:3000/api/token/profile', {
      method: 'GET',
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok){
      const data = await response.json()
      console.log('API 回應資料:', data)
  
      // 取出過期時間
      const { email, username, exp, iat } = data.user
      const expDate = new Date(exp * 1000) // 將秒轉換為毫秒
      // exp 過期時間轉換為當地時間
      const expDateLocal = expDate.toLocaleString()
      loginName.textContent = username
      loginExp.textContent = `過期時間 (exp)：${expDateLocal}`
  
      if (data.status === 'success') {
        fetchUsers()
      }
      console.log('--------')
    }

  } catch (error) {
    console.error('API 請求錯誤:', error)
  }
}

// Get Token
const fetchToken = async () => {
  const response = await fetch('http://localhost:3000/api/token', {
    method: 'GET',
  })
  const responseData = await response.json()
  console.log(`responseData`, responseData)
  localStorage.setItem('DB-token', responseData.data.token)
  localStorage.setItem('DB-expiresAt', responseData.data.expiresAt)
}
const fetchCheckToken = async () => {
  const token = localStorage.getItem('DB-token')
  try {
    console.log(`local-token`, token)
    const response = await fetch('http://localhost:3000/api/token/validate', {
      method: 'GET',
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token 已過期或無效，請重新登錄')
        // 執行重新登錄或刷新 token 的邏輯
      } else {
        console.log('API 請求錯誤:', response.status)
      }
      return
    }
    const data = await response.json()
    console.log('API 回應資料:', data)
    console.log('--------')
  } catch (error) {
    console.error('API 請求錯誤:', error)
  }
}

// ===================
// ... Users ...
// ===================
// !Get user 第一種 取資料GET
const fetchUsers = async () => {
  // http://localhost:3000/api/users   => prodDB
  // http://localhost:3000/api2/users  => devDB
  // http://localhost:3000/api3/users  => testDB
  const response = await fetch('http://localhost:3000/api/users' , {
    method: 'GET',
    headers: {
      // 'Authorization': 'Bearer your_token_here', // 發送授權令
      'X-Client-From': 'localDB',   // 自定義標頭，指定客戶端來源
      // 'X-Client-Language': 'zh-TW',   // 自定義標頭，指定客戶端語言
    },
  });
  const users = await response.json();
  await handlerRender(users);
}

// !Get user 第二種 取資料POST
// const fetchUsers = async () => {
//   // http://localhost:3000/api/users   => prodDB
//   // http://localhost:3000/api2/users  => devDB
//   // http://localhost:3000/api3/users  => testDB
//   const queryData = {
//     database: 'prodDB',
//     collection: 'AdminUserData',
//   }
//   const response = await fetch('http://localhost:3000/api/users/get-users?room=555', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'X-Client-From': 'localDB', // 自定義標頭，指定客戶端來源
//     },
//     body: JSON.stringify(queryData),
//   })
//   const users = await response.json()
//   await handlerRender(users)
// }
const handlerRender = (users) => {
  console.log('res', users)
  let html = ''
  users.data.forEach((element) => {
    html += `
      <li>
        <h2 id="${element._id}">${element.name}</h2>
        <span>${element.age}</span>
        <p>${element._id}</p>
      </li>
    `
  })
  el.innerHTML = html
}
// Create user
const createUser = async (userData) => {
  // const token = localStorage.getItem('DB-token');
  const token = localStorage.getItem('JWT-token')
  // userData = {name: 'Curry', age: '30'}
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
    body: JSON.stringify(userData),
  })
  const result = await response.json()
  console.log('User created:', result)
  fetchUsers() // Refresh user list
  createForm.reset() // Clear form
}
// Update user
const updateUser = async (userId, updateData) => {
  const token = localStorage.getItem('JWT-token')
  const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`,
    },
    body: JSON.stringify(updateData),
  })
  const result = await response.json()
  console.log('User updated:', result)
  fetchUsers() // Refresh user list
  updateForm.reset() // Clear form
}
// Delete user
const deleteUser = async (userId) => {
  const token = localStorage.getItem('JWT-token')
  const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${token}`,
    },
  })
  const result = await response.json()
  console.log('User deleted:', result)
  fetchUsers() // Refresh user list
  deleteForm.reset() // Clear form
}

// ===================
// ... Event listeners ...
// ===================
createForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const name = document.getElementById('create-name').value
  const age = document.getElementById('create-age').value
  createUser({ name, age })
})
updateForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const id = document.getElementById('update-id').value
  const name = document.getElementById('update-name').value
  const age = document.getElementById('update-age').value
  updateUser(id, { name, age })
})
deleteForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const id = document.getElementById('delete-id').value
  deleteUser(id)
})
signupForm.addEventListener('submit', handleSignup)
loginForm.addEventListener('submit', handleLogin)
signupTab.addEventListener('click', () => {
  signupForm.style.display = 'block'
  loginForm.style.display = 'none'
  signupTab.classList.add('active')
  loginTab.classList.remove('active')
})
loginTab.addEventListener('click', () => {
  signupForm.style.display = 'none'
  loginForm.style.display = 'block'
  loginTab.classList.add('active')
  signupTab.classList.remove('active')
})

// init
const handlerInit = async () => {
  // await fetchToken()
  // await fetchCheckToken()
  fetchUsers();

  // 確保頁面加載時預設顯示註冊表單
  // signupTab.click()

  // // 計時器 檢查 token 是否變化
  // await fetchCheckJwtToken()
  // const timer = setInterval(() => {
  //   const token2 = localStorage.getItem('JWT-token'); // 取得最新的 token
  //   // console.log('token', token)
  //   // console.log('token2', token2)
  //   if (token !== token2) {
  //     console.log('Token 不一樣，重新加載頁面');
  //     clearInterval(timer); // 停止計時器，避免多次重新加載
  //     window.location.reload();
  //     // 跳轉首頁
  //     // window.location.href = "/";
  //   }
  // }, 5000); 
}
handlerInit()
