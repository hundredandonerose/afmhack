import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme/colors";

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SegmentedPill<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 10,
    alignItems: "center",
  },
  active: {
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.muted,
    fontWeight: "700",
  },
  activeLabel: {
    color: colors.primary,
  },
});
