class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
const moonbitlang$core$builtin$$JSArray$push = (arr, val) => { arr.push(val); };
const moonbitlang$core$builtin$$JSArray$set_length = (arr, len) => { arr.length = len; };
const moonbitlang$core$array$$JSArray$copy = (arr) => arr.slice(0);
function Token$Enum(param0) {
  this._0 = param0;
}
Token$Enum.prototype.$tag = 0;
Token$Enum.prototype.type = 'enum';
function Token$Required(param0) {
  this._0 = param0;
}
Token$Required.prototype.$tag = 1;
Token$Required.prototype.type = 'required';
function Token$Optional(param0) {
  this._0 = param0;
}
Token$Optional.prototype.$tag = 2;
Token$Optional.prototype.type = 'optional';
const $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Continue$0$ = { $tag: 0 };
function $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Break$0$(param0) {
  this._0 = param0;
}
$64$moonbitlang$47$core$47$builtin$46$ForeachResult$Break$0$.prototype.$tag = 1;
function $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Return$0$(param0) {
  this._0 = param0;
}
$64$moonbitlang$47$core$47$builtin$46$ForeachResult$Return$0$.prototype.$tag = 2;
function $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Error$0$(param0) {
  this._0 = param0;
}
$64$moonbitlang$47$core$47$builtin$46$ForeachResult$Error$0$.prototype.$tag = 3;
function $64$moonbitlang$47$core$47$builtin$46$ForeachResult$JumpOuter$0$(param0) {
  this._0 = param0;
}
$64$moonbitlang$47$core$47$builtin$46$ForeachResult$JumpOuter$0$.prototype.$tag = 4;
function moonbitlang$core$string$$String$substring$46$inner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    end$2 = _Some;
  }
  return start >= 0 && (start <= end$2 && end$2 <= len) ? self.substring(start, end$2) : $panic();
}
function moonbitlang$core$array$$Array$push$0$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$push$1$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$builtin$$println$0$(input) {
  console.log(input);
}
function moonbitlang$core$array$$Array$unsafe_truncate_to_length$0$(self, new_len) {
  moonbitlang$core$builtin$$JSArray$set_length(self, new_len);
}
function moonbitlang$core$array$$Array$clear$0$(self) {
  moonbitlang$core$array$$Array$unsafe_truncate_to_length$0$(self, 0);
}
function moonbitlang$core$array$$Array$copy$0$(self) {
  return moonbitlang$core$array$$JSArray$copy(self);
}
function moonbitlang$core$string$$code_point_of_surrogate_pair(leading, trailing) {
  return (((Math.imul(leading - 55296 | 0, 1024) | 0) + trailing | 0) - 56320 | 0) + 65536 | 0;
}
function moonbitlang$core$string$$String$iter(self) {
  const _p = (yield_) => {
    const len = self.length;
    let _tmp = 0;
    while (true) {
      const index = _tmp;
      if (index < len) {
        const c1 = self.charCodeAt(index);
        if (55296 <= c1 && c1 <= 56319 && (index + 1 | 0) < len) {
          const _tmp$2 = index + 1 | 0;
          const c2 = self.charCodeAt(_tmp$2);
          if (56320 <= c2 && c2 <= 57343) {
            const c = moonbitlang$core$string$$code_point_of_surrogate_pair(c1, c2);
            const _bind = yield_(c);
            if (_bind === 1) {
              _tmp = index + 2 | 0;
              continue;
            } else {
              return 0;
            }
          }
        }
        const _bind = yield_(c1);
        if (_bind === 1) {
        } else {
          return 0;
        }
        _tmp = index + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  };
  return _p;
}
function username$command_tokenizer$$error$0$(message) {
  moonbitlang$core$builtin$$println$0$(message);
}
function username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env) {
  const enums = _env._1;
  const tokens = _env._0;
  if (enums.length > 0) {
    moonbitlang$core$array$$Array$push$1$(tokens, new Token$Enum(moonbitlang$core$array$$Array$copy$0$(enums)));
    moonbitlang$core$array$$Array$clear$0$(enums);
    return;
  } else {
    return;
  }
}
function username$command_tokenizer$$command_tokens(c) {
  const chars = `${c}\u0000`;
  const tokens = [];
  const enums = [];
  const char_index = { val: -1 };
  const state = { val: 0 };
  const capture0_start = { val: -1 };
  const capture0_end = { val: -1 };
  const capture1_start = { val: -1 };
  const capture1_end = { val: -1 };
  const capture2_start = { val: -1 };
  const capture2_end = { val: -1 };
  const _env = { _0: tokens, _1: enums };
  let _foreach_result = $64$moonbitlang$47$core$47$builtin$46$ForeachResult$Continue$0$;
  const _bind = moonbitlang$core$string$$String$iter(chars);
  _bind((char) => {
    char_index.val = char_index.val + 1 | 0;
    _L: {
      _L$2: {
        _L$3: {
          _L$4: {
            if (char === 124) {
              const _bind$2 = state.val;
              switch (_bind$2) {
                case 1: {
                  state.val = 3;
                  capture0_end.val = char_index.val;
                  moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
                  break;
                }
                case 2: {
                  state.val = 3;
                  break;
                }
                default: {
                  username$command_tokenizer$$error$0$("Unexpected '|' character");
                }
              }
            } else {
              if (char === 32) {
                break _L$4;
              } else {
                if (char === 10) {
                  break _L$4;
                } else {
                  if (char === 60) {
                    _L$5: {
                      _L$6: {
                        const _bind$2 = state.val;
                        switch (_bind$2) {
                          case 0: {
                            break _L$6;
                          }
                          case 2: {
                            break _L$6;
                          }
                          default: {
                            username$command_tokenizer$$error$0$("Unexpected '<' character");
                          }
                        }
                        break _L$5;
                      }
                      state.val = 4;
                      username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                    }
                  } else {
                    if (char === 62) {
                      const _bind$2 = state.val;
                      switch (_bind$2) {
                        case 14: {
                          state.val = 0;
                          moonbitlang$core$array$$Array$push$1$(tokens, new Token$Required({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, capture2_end.val) }));
                          break;
                        }
                        case 10: {
                          state.val = 0;
                          moonbitlang$core$array$$Array$push$1$(tokens, new Token$Required({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, char_index.val) }));
                          break;
                        }
                        default: {
                          username$command_tokenizer$$error$0$("Unexpected '>' character");
                        }
                      }
                    } else {
                      if (char === 91) {
                        _L$5: {
                          _L$6: {
                            const _bind$2 = state.val;
                            switch (_bind$2) {
                              case 0: {
                                break _L$6;
                              }
                              case 2: {
                                break _L$6;
                              }
                              default: {
                                username$command_tokenizer$$error$0$("Unexpected '[' character");
                              }
                            }
                            break _L$5;
                          }
                          state.val = 5;
                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                        }
                      } else {
                        if (char === 93) {
                          const _bind$2 = state.val;
                          switch (_bind$2) {
                            case 15: {
                              state.val = 0;
                              moonbitlang$core$array$$Array$push$1$(tokens, new Token$Optional({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, capture2_end.val) }));
                              break;
                            }
                            case 11: {
                              state.val = 0;
                              moonbitlang$core$array$$Array$push$1$(tokens, new Token$Optional({ name: moonbitlang$core$string$$String$substring$46$inner(c, capture1_start.val, capture1_end.val), vType: moonbitlang$core$string$$String$substring$46$inner(c, capture2_start.val, char_index.val) }));
                              break;
                            }
                            default: {
                              username$command_tokenizer$$error$0$("Unexpected ']' character");
                            }
                          }
                        } else {
                          if (char === 58) {
                            const _bind$2 = state.val;
                            switch (_bind$2) {
                              case 8: {
                                state.val = 6;
                                capture1_end.val = char_index.val;
                                break;
                              }
                              case 9: {
                                state.val = 7;
                                capture1_end.val = char_index.val;
                                break;
                              }
                              case 12: {
                                state.val = 6;
                                break;
                              }
                              case 13: {
                                state.val = 7;
                                break;
                              }
                              default: {
                                username$command_tokenizer$$error$0$("Unexpected ':' character");
                              }
                            }
                          } else {
                            if (char >= 97 && char <= 122) {
                              break _L$2;
                            } else {
                              if (char >= 65 && char <= 90) {
                                break _L$2;
                              } else {
                                if (char >= 48 && char <= 57) {
                                  break _L$2;
                                } else {
                                  if (char === 95) {
                                    break _L$2;
                                  } else {
                                    if (char === 0) {
                                      const _bind$2 = state.val;
                                      switch (_bind$2) {
                                        case 1: {
                                          capture0_end.val = char_index.val;
                                          moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
                                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                                          break;
                                        }
                                        case 2: {
                                          username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                                          break;
                                        }
                                        case 0: {
                                          break;
                                        }
                                        default: {
                                          username$command_tokenizer$$error$0$("Unexpected character");
                                        }
                                      }
                                    } else {
                                      username$command_tokenizer$$error$0$("Unexpected character");
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            break _L$3;
          }
          const _bind$2 = state.val;
          switch (_bind$2) {
            case 1: {
              state.val = 2;
              capture0_end.val = char_index.val;
              moonbitlang$core$array$$Array$push$0$(enums, moonbitlang$core$string$$String$substring$46$inner(c, capture0_start.val, capture0_end.val));
              break;
            }
            case 8: {
              state.val = 12;
              capture1_end.val = char_index.val;
              break;
            }
            case 9: {
              state.val = 13;
              capture1_end.val = char_index.val;
              break;
            }
            case 10: {
              state.val = 14;
              capture2_end.val = char_index.val;
              break;
            }
            case 11: {
              state.val = 15;
              capture2_end.val = char_index.val;
              break;
            }
            default: {
              return 1;
            }
          }
        }
        break _L;
      }
      _L$3: {
        _L$4: {
          _L$5: {
            _L$6: {
              const _bind$2 = state.val;
              switch (_bind$2) {
                case 0: {
                  break _L$6;
                }
                case 3: {
                  break _L$6;
                }
                case 2: {
                  state.val = 1;
                  username$command_tokenizer$$command_tokens$46$add_enums$124$13(_env);
                  capture0_start.val = char_index.val;
                  break;
                }
                case 12: {
                  break _L$4;
                }
                case 14: {
                  break _L$4;
                }
                case 15: {
                  break _L$4;
                }
                case 13: {
                  break _L$4;
                }
                case 4: {
                  state.val = 8;
                  capture1_start.val = char_index.val;
                  break;
                }
                case 5: {
                  state.val = 9;
                  capture1_start.val = char_index.val;
                  break;
                }
                case 6: {
                  state.val = 10;
                  capture2_start.val = char_index.val;
                  break;
                }
                case 7: {
                  state.val = 11;
                  capture2_start.val = char_index.val;
                  break;
                }
                default: {
                  return 1;
                }
              }
              break _L$5;
            }
            state.val = 1;
            capture0_start.val = char_index.val;
          }
          break _L$3;
        }
        username$command_tokenizer$$error$0$("Unexpected identifier");
      }
    }
    return 1;
  });
  const _tmp = _foreach_result;
  switch (_tmp.$tag) {
    case 0: {
      break;
    }
    case 1: {
      const _break = _tmp;
      _break._0;
      break;
    }
    case 2: {
      const _return = _tmp;
      return _return._0;
    }
    case 3: {
      $panic();
      break;
    }
    default: {
      $panic();
    }
  }
  return tokens;
}
export {
    username$command_tokenizer$$command_tokens as commandToken,
    Token$Enum as Enum,
    Token$Optional as Optional,
    Token$Required as Required,
}