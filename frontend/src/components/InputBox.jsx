import cn from "classnames";
const InputBox = ({
  label,
  placeholder,
  name,
  value,
  handleFormChange,
  isPassword,
}) => {
  const inputClass = cn(
    "bg-white text-base m-2 h-8 rounded-sm p-1 resize-none shadow-xl/10 shadow-slate-900"
  );
  if (isPassword === true) {
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
        ></input>
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
      />
    </>
  );
};

export default InputBox;
