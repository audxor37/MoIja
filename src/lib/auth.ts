type PasswordSignInInput = {
  email: string;
  password: string;
};

type PasswordSignUpInput = PasswordSignInInput & {
  nickname: string;
};

type PasswordAuthResult =
  | {
      ok: true;
      email: string;
      password: string;
    }
  | {
      ok: false;
      message: string;
    };

type PasswordSignUpResult =
  | {
      ok: true;
      email: string;
      password: string;
      nickname: string;
    }
  | {
      ok: false;
      message: string;
    };

type PasswordProfileInput = {
  id: string;
  email?: string | null;
  nickname: string;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePasswordSignInInput(input: PasswordSignInInput): PasswordAuthResult {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email) {
    return {
      ok: false,
      message: "이메일을 입력하세요."
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      message: "올바른 이메일을 입력하세요."
    };
  }

  if (!password) {
    return {
      ok: false,
      message: "비밀번호를 입력하세요."
    };
  }

  return {
    ok: true,
    email,
    password
  };
}

export function validatePasswordSignUpInput(input: PasswordSignUpInput): PasswordSignUpResult {
  const signInInput = validatePasswordSignInInput(input);
  const nickname = input.nickname.trim();

  if (!signInInput.ok) {
    return signInInput;
  }

  if (!nickname) {
    return {
      ok: false,
      message: "닉네임을 입력하세요."
    };
  }

  if (signInInput.password.length < 6) {
    return {
      ok: false,
      message: "비밀번호는 6자 이상 입력하세요."
    };
  }

  return {
    ok: true,
    email: signInInput.email,
    password: signInInput.password,
    nickname
  };
}

export function profileFromPasswordUser(input: PasswordProfileInput) {
  return {
    id: input.id,
    kakao_id: `email:${input.id}`,
    nickname: input.nickname,
    avatar_url: null
  };
}
