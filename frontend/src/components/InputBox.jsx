import cn from "classnames";

// Maps field name to the correct autocomplete token so browsers and
// Google Safe Browsing can identify this as a legitimate credential form.
const AUTOCOMPLETE_MAP = {
  email: "email",
  username: "username",
  name: "name",
  password: "current-password",
  newPassword: "new-password",
};

const InputBox = ({
  label,
  placeholder,
  name,
  value,
  handleFormChange,
  isPassword,
  isNewPassword,
}) => {
  const inputClass = cn(
    "bg-white text-base m-2 h-8 rounded-sm p-1 resize-none shadow-xl/10 shadow-slate-900"
  );

  if (isPassword === true) {
    const autoComplete = isNewPassword ? "new-password" : "current-password";
    return (
      <>
        <label className="font-semibold ml-2">{label}</label>
        <input
          type="password"
          className={inputClass}
          name={name}
          placeholder={placeholder}
          onChange={handleFormChange}
          value={value}
          autoComplete={autoComplete}
        />
      </>
    );
  }

  return (
    <>
      <label className="font-semibold ml-2">{label}</label>
      <input
        type={name === "email" ? "email" : "text"}
        className={inputClass}
        name={name}
        placeholder={placeholder}
        onChange={handleFormChange}
        value={value}
        autoComplete={AUTOCOMPLETE_MAP[name] ?? "off"}
      />
    </>
  );
};

export default InputBox;
