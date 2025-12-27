fn[T: Show] error(message: T) -> Unit {
    println(message)
}

pub struct Var {
    name: String
    vType: String
} derive(Show)

pub enum Token {
    Enum(Array[String])
    Required(Var)
    Optional(Var)
} derive(Show)

pub enum TokenState {
    None
    Enum
    EnumBlank
    EnumSeperator
    Required
    Optional
    RequiredSeperator
    OptionalSeperator
    RequiredVarName
    OptionalVarName
    RequiredVarType
    OptionalVarType
    RequiredVarNameBlank
    OptionalVarNameBlank
    RequiredVarTypeBlank
    OptionalVarTypeBlank
}

pub fn command_tokens(c: String) -> Array[Token] {
    let chars = c + "\u0000"
    let tokens: Array[Token] = []
    let enums: Array[String] = []
    let mut char_index = -1
    let mut state = TokenState::None
    let mut capture0_start = -1
    let mut capture0_end = -1
    let mut capture1_start = -1
    let mut capture1_end = -1
    let mut capture2_start = -1
    let mut capture2_end = -1

    fn add_enums() -> Unit {
        if enums.length() > 0 {
            tokens.push(Token::Enum(enums.copy()))
            enums.clear()
        }
    }

    for char in chars.iter() {
        char_index += 1
        match char {
            '|' => match state {
                Enum => {
                    state = TokenState::EnumSeperator
                    capture0_end = char_index
                    enums.push(c.substring(
                        start = capture0_start,
                        end = capture0_end))
                }
                EnumBlank => {
                    state = TokenState::EnumSeperator
                }
                _ => error("Unexpected '|' character")
            }
            ' ' | '\n' => match state {
                Enum => {
                    state = TokenState::EnumBlank
                    capture0_end = char_index
                    enums.push(c.substring(
                        start = capture0_start,
                        end = capture0_end))
                }
                RequiredVarName => {
                    state = RequiredVarNameBlank
                    capture1_end = char_index
                }
                OptionalVarName => {
                    state = OptionalVarNameBlank
                    capture1_end = char_index
                }
                RequiredVarType => {
                    state = RequiredVarTypeBlank
                    capture2_end = char_index
                }
                OptionalVarType => {
                    state = OptionalVarTypeBlank
                    capture2_end = char_index
                }
                _ => continue
            }
            '<' => match state {
                None | EnumBlank => {
                    state = TokenState::Required
                    add_enums()
                }
                _ => error("Unexpected '<' character")
            }
            '>' => match state {
                RequiredVarTypeBlank => {
                    state = TokenState::None

                    tokens.push(Token::Required(Var::{
                        name: c.substring(
                            start = capture1_start,
                            end = capture1_end),

                        vType: c.substring(
                            start = capture2_start,
                            end = capture2_end),
                    }))
                }
                RequiredVarType => {
                    state = TokenState::None

                    tokens.push(Token::Required(Var::{
                        name: c.substring(
                            start = capture1_start,
                            end = capture1_end),

                        vType: c.substring(
                            start = capture2_start,
                            end = char_index),
                    }))
                }
                _ => error("Unexpected '>' character")
            }
            '[' => match state {
                None | EnumBlank => {
                    state = TokenState::Optional
                    add_enums()
                }
                _ => error("Unexpected '[' character")
            }
            ']' => match state {
                OptionalVarTypeBlank => {
                    state = TokenState::None

                    tokens.push(Token::Optional(Var::{
                        name: c.substring(
                            start = capture1_start,
                            end = capture1_end),

                        vType: c.substring(
                            start = capture2_start,
                            end = capture2_end),
                    }))
                }
                OptionalVarType => {
                    state = TokenState::None

                    tokens.push(Token::Optional(Var::{
                        name: c.substring(
                            start = capture1_start,
                            end = capture1_end),

                        vType: c.substring(
                            start = capture2_start,
                            end = char_index),
                    }))
                }
                _ => error("Unexpected ']' character")
            }
            ':' => match state {
                RequiredVarName => {
                    state = RequiredSeperator
                    capture1_end = char_index
                }
                OptionalVarName => {
                    state = OptionalSeperator
                    capture1_end = char_index
                }
                RequiredVarNameBlank => state = RequiredSeperator
                OptionalVarNameBlank => state = OptionalSeperator
                _ => error("Unexpected ':' character")
            }
            'a'..='z' | 'A'..='Z' | '0'..='9' | '_' => match state {
                None | EnumSeperator => {
                    state = TokenState::Enum
                    capture0_start = char_index
                }

                EnumBlank => {
                    state = TokenState::Enum
                    add_enums()
                    capture0_start = char_index
                }

                RequiredVarNameBlank
                    | RequiredVarTypeBlank
                    | OptionalVarTypeBlank
                    | OptionalVarNameBlank => error("Unexpected identifier")

                Required => {
                    state = RequiredVarName
                    capture1_start = char_index
                }

                Optional => {
                    state = OptionalVarName
                    capture1_start = char_index
                }

                RequiredSeperator => {
                    state = RequiredVarType
                    capture2_start = char_index
                }

                OptionalSeperator => {
                    state = OptionalVarType
                    capture2_start = char_index
                }

                _ => continue
            }
            '\u0000' => {
                match state {
                    Enum => {
                        capture0_end = char_index
                        enums.push(c.substring(
                            start = capture0_start,
                            end = capture0_end))
                        add_enums()
                    }
                    EnumBlank => {
                        add_enums()
                    }
                    None => ignore("")
                    _ => error("Unexpected character")
                }
            }
            _ => error("Unexpected character")
        }
    }

    tokens
}

test "print" {
    println(command_tokens("<test: entity> ok [ wow : actor ]"))
}

test "requires" {
    println(command_tokens("<a:b> < c:d> <e :f> < g :h> <i: j> <k: l >"))
}

test "optionals" {
    println(command_tokens("[a:b] [ c:d] [e :f] [ g :h] [i: j] [k: l ]"))
}

test "enums" {
    println(command_tokens("[a:b] a|b|c d|e f g"))
}