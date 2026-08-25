(() => {
  const HOTFIX_VERSION = "1.1.1";
  const LOGIN_ENDPOINT = `${SUPABASE_URL}/functions/v1/ejazati-login`;

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function friendlyAuthError(error) {
    const msg = String(error?.message || error || "");
    if (/invalid login credentials/i.test(msg)) return "اسم المستخدم/البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (/email not confirmed/i.test(msg)) return "يرجى تأكيد البريد الإلكتروني أولًا.";
    if (/user already registered/i.test(msg)) return "يوجد حساب بهذا البريد بالفعل. استخدم تسجيل الدخول.";
    if (/duplicate|unique|23505/i.test(msg)) return "اسم المستخدم مستخدم بالفعل. اختر اسمًا آخر.";
    return "تعذر إكمال العملية. حاول مرة أخرى.";
  }

  const oldLogin = document.getElementById("loginEmail");
  if (oldLogin) {
    oldLogin.id = "loginIdentifier";
    oldLogin.type = "text";
    oldLogin.autocomplete = "username";
    oldLogin.autocapitalize = "none";
    oldLogin.spellcheck = false;
    oldLogin.placeholder = "اسم المستخدم أو البريد الإلكتروني";
    const label = oldLogin.closest(".field")?.querySelector("label");
    if (label) label.textContent = "اسم المستخدم أو البريد الإلكتروني";
  }

  const signupEmail = document.getElementById("signupEmail");
  if (signupEmail && !document.getElementById("signupUsername")) {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `
      <label>اسم المستخدم</label>
      <input id="signupUsername" type="text" autocomplete="username" minlength="3" maxlength="30"
        autocapitalize="none" spellcheck="false" placeholder="مثال: irumaithy" required>
      <small style="display:block;color:var(--muted);font-size:10px;margin-top:6px">
        3–30 أحرف إنجليزية صغيرة، أرقام، نقطة، شرطة أو _
      </small>`;
    signupEmail.closest(".field")?.before(field);
    field.querySelector("input")?.addEventListener("input", (e) => {
      e.target.value = normalizeUsername(e.target.value).replace(/[^a-z0-9._-]/g, "");
    });
  }

  const displayName = document.getElementById("displayName");
  if (displayName && !document.getElementById("accountUsername")) {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `
      <label>اسم المستخدم</label>
      <input id="accountUsername" type="text" autocomplete="username" minlength="3" maxlength="30"
        autocapitalize="none" spellcheck="false">
      <small style="display:block;color:var(--muted);font-size:10px;margin-top:6px">
        يمكن استخدامه بدل البريد عند تسجيل الدخول.
      </small>`;
    displayName.closest(".field")?.before(field);
    field.querySelector("input")?.addEventListener("input", (e) => {
      e.target.value = normalizeUsername(e.target.value).replace(/[^a-z0-9._-]/g, "");
    });
  }

  window.signIn = async function signInWithIdentifier(event) {
    event?.preventDefault();

    const identifier = document.getElementById("loginIdentifier")?.value?.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";
    const submit = document.querySelector("#loginForm button[type='submit']");

    if (!identifier || !password) {
      return authMessage("اكتب اسم المستخدم/البريد وكلمة المرور.");
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "جاري تسجيل الدخول…";
    }

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY
        },
        body: JSON.stringify({ identifier, password })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.access_token || !payload.refresh_token) {
        return authMessage("اسم المستخدم/البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      }

      const { error } = await client.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token
      });

      if (error) return authMessage(friendlyAuthError(error));
      // The existing Supabase client has persistSession + autoRefreshToken enabled.
      // setSession therefore persists this login until the user explicitly signs out.
    } catch (error) {
      console.error("Ejazati login hotfix", error);
      authMessage("تعذر الاتصال بخدمة تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "تسجيل الدخول";
      }
    }
  };

  window.signUp = async function signUpWithUsername(event) {
    event?.preventDefault();

    const name = document.getElementById("signupName")?.value?.trim() || "";
    const username = normalizeUsername(document.getElementById("signupUsername")?.value);
    const email = document.getElementById("signupEmail")?.value?.trim() || "";
    const password = document.getElementById("signupPassword")?.value || "";
    const submit = document.querySelector("#signupForm button[type='submit']");

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return authMessage("اسم المستخدم يجب أن يكون 3–30 حرفًا ويحتوي فقط على أحرف إنجليزية صغيرة وأرقام و . _ -");
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "جاري إنشاء الحساب…";
    }

    try {
      const availability = await client.rpc("ejazati_username_available", {
        p_username: username
      });

      if (availability.error) return authMessage("تعذر التحقق من اسم المستخدم.");
      if (availability.data !== true) return authMessage("اسم المستخدم مستخدم بالفعل. اختر اسمًا آخر.");

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            username
          }
        }
      });

      if (error) return authMessage(friendlyAuthError(error));

      if (data.session) {
        authMessage("تم إنشاء الحساب وتسجيل الدخول.", true);
      } else {
        authMessage("تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا ستصلك رسالة تأكيد، ثم يمكنك تسجيل الدخول.", true);
        showLogin();
      }
    } catch (error) {
      console.error("Ejazati signup hotfix", error);
      authMessage("تعذر إنشاء الحساب. حاول مرة أخرى.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "إنشاء الحساب";
      }
    }
  };

  window.forgotPassword = async function forgotPasswordHotfix() {
    const identifier = document.getElementById("loginIdentifier")?.value?.trim() || "";
    const email = identifier.includes("@")
      ? identifier
      : (prompt("لإعادة كلمة المرور، اكتب البريد الإلكتروني المسجل في الحساب:") || "").trim();

    if (!email || !email.includes("@")) return;

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname
    });

    authMessage(
      error ? friendlyAuthError(error) : "إذا كان البريد مسجلًا، ستصلك رسالة إعادة تعيين كلمة المرور.",
      !error
    );
  };

  if (typeof renderSettings === "function") {
    const originalRenderSettings = renderSettings;

    renderSettings = function renderSettingsWithUsername() {
      originalRenderSettings();
      const input = document.getElementById("accountUsername");
      if (input) input.value = profile?.username || "";
    };
  }

  window.saveSettings = async function saveSettingsWithUsername() {
    const username = normalizeUsername(document.getElementById("accountUsername")?.value);

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return toast("تحقق من اسم المستخدم");
    }

    const profileRes = await client
      .from("ejazati_profiles")
      .update({
        display_name: document.getElementById("displayName")?.value?.trim() || null,
        username,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.user.id);

    const settingRes = await client
      .from("ejazati_leave_settings")
      .upsert({
        user_id: session.user.id,
        base_balance: Number(document.getElementById("baseBalance")?.value || 0),
        carried_balance: Number(document.getElementById("carryBalance")?.value || 0),
        carry_expiry: document.getElementById("carryExpiry")?.value || null,
        weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
        updated_at: new Date().toISOString()
      });

    if (profileRes.error) {
      return toast(profileRes.error.code === "23505"
        ? "اسم المستخدم مستخدم بالفعل"
        : "تعذر حفظ الحساب");
    }

    if (settingRes.error) return toast("تعذر حفظ إعدادات الإجازة");

    profile.display_name = document.getElementById("displayName")?.value?.trim() || null;
    profile.username = username;
    await loadData();
    toast("تم حفظ الإعدادات");
  };

  if (typeof profile !== "undefined" && profile && typeof renderSettings === "function") {
    try { renderSettings(); } catch (_) {}
  }

  document.querySelectorAll(".version").forEach((el) => {
    el.textContent = `إجازاتي · v${HOTFIX_VERSION} · Cloud Sync`;
  });
})();
