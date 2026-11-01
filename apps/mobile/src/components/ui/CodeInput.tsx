import { TextField } from './TextField';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
};

/** 6자리 숫자 코드. 붙여넣기·자동 완성(문자/메일 코드)을 허용하고 숫자만 남긴다. */
export function CodeInput({ label, value, onChangeText, error }: Props) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
      keyboardType="number-pad"
      inputMode="numeric"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      maxLength={6}
      error={error}
    />
  );
}
