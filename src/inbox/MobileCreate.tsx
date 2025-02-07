import * as React from 'react';
import { FC, Fragment, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import closeIcon from '../assets/red/m-close.png';
import downIcon from '../assets/red/m-down.png';
import { AssetOptions } from './utils'
import { fetch } from '../utils'
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../types';

const useStyles = makeStyles(theme => ({
  root: {
    padding: '30px 0',
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    overflowY: 'auto',
    background: '#fff',

    '&.hide': {
      display: 'none',
    }
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 22px',

    '& .close': {
      width: '14px',
      height: '14px',
      background: `url(${closeIcon})`,
      backgroundSize: '100%',
    },

    '& .send': {
      width: '70px',
      height: '30px',
      lineHeight: '30px',
      backgroundColor: '#f55d46',
      borderRadius: '30px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#fff',

      '&.disabled': {
        backgroundColor: '#FCB6AB',
      }
    }
  },
  form: {
    marginTop: '20px',

    '& .item': {
      padding: '15px 22px',

      '& span': {
        fontSize: '14px',
        color: '#727272',
      },
    },

    '& .bbLine': {
      padding: '5px 22px',
      borderBottom: '1px solid #E6E6E6',
    },

    '& input': {
      padding: '10px 0',
      border: 'none',
      color: 'rgba(0, 0, 0, 0.87)',
      width: '100%',

      '&::placeholder': {
        color: '#727272',
      }
    },

    '& .content': {
      minHeight: '200px',
      paddingTop: '10px',
      outline: 'none',
      fontSize: '14px',
      lineHeight: '20px',
    },
    '& .asset': {
      '& select, & input': {
        width: '90px',
        height: '30px',
        padding: '0 10px',
        border: 'none',
        lineHeight: '30px',
        marginLeft: '15px',
        backgroundColor: '#F2F0EC',
        borderRadius: '30px',
        fontSize: '12px',
        'box-sizing': 'border-box'
      },
      '& select': {
        appearance: 'none',
        background: `#F2F0EC url(${downIcon}) no-repeat 68px center`,
        backgroundSize: '10px 6px',
      },
      '& input::placeholder': {
        color: '#ccc'
      }
    },

    '& .contentWrap': {
      position: 'relative',
    },
    '& .contentPlaceHolder': {
      position: 'absolute',
      top: '10px',
      fontSize: '14px',
    }
  }
}))
interface Props {
  show: Boolean;
  hideCompose: () => void;
  notify: any;
}

const defaultFormData = {
  account: '',
  subject: '',
  asset: AssetOptions.length ? AssetOptions[0].id : '',
  amount: '',
}

const MobileCreate: FC<Props> = ({ show, hideCompose, notify }) => {
  const classes = useStyles();
  const email = useSelector((state: AppState) => state.email);

  const [sendDisabled, setSendDisabled] = useState(false)
  const [isAllValidExceptContent, setIsAllValidExceptContent] = useState(false)
  const [isContentValid, setIsContentValid] = useState(false)
  const [formData, setFormData] = useState({ ...defaultFormData })

  const onSend = async () => {
    if (sendDisabled) {
      return
    }
    try {
      const { data: { success, msg, code } } = await fetch('mails', 'create', {
        dm_to: formData.account,
        dm_subject: formData.subject,
        Assets: formData.asset,
        Amount: formData.amount,
        Price: '',
        dm_content: document.querySelector('#content')?.innerHTML,
        dm_email_path: email,
        dm_from: `${email.replace('@ic.dmail.ai', '')}  <${email}>`,
      })
      if (success) {
        notify(`resources.reviews.notification.created_success`, 'success');
        setTimeout(() => {
          window.location.href = window.location.href.replace('mails', 'sents')
        }, 500)
      } else {
        notify(`resources.reviews.notification.submit_failed`, 'error', {
          message: msg
        });
      }
    } catch (error) {
      notify(`resources.reviews.notification.submit_failed`, 'error');
    }
  }

  const onSetFormData = (name, value) => {
    setFormData({ ...formData, ...{ [name]: value } })
  }

  useEffect(() => {
    setSendDisabled(!(isContentValid && isAllValidExceptContent))
  }, [isAllValidExceptContent, isContentValid])

  useEffect(() => {
    const hasInvalidFormData = Object.values(formData).filter((value) => !value.trim().length)
    setIsAllValidExceptContent(!hasInvalidFormData.length)
  }, [formData])

  useEffect(() => {
    const content = document.querySelector('#content') as HTMLDivElement
    if (content) {
      const config = { childList: true };
      const observer = new MutationObserver((mutationsList, observer) => {
        setIsContentValid(!!content.innerText.replaceAll('\n', '').trim().length)
      });
      observer.observe(content, config);
    }
  }, [])

  return (
    <div className={clsx(classes.root, show ? "" : "hide")}>
      <div className={classes.top}>
        <span className="close" onClick={hideCompose}></span>
        <span className={clsx("send", sendDisabled ? 'disabled' : '')} onClick={onSend}>Send</span>
      </div>
      <div className={classes.form}>
        <div className="item bbLine">
          <input type="text" placeholder="Account" value={formData.account} onChange={(ev) => onSetFormData('account', ev.target.value)} />
        </div>
        <div className="item bbLine">
          <input type="text" placeholder="Subject" value={formData.subject} onChange={(ev) => onSetFormData('subject', ev.target.value)} />
        </div>
        <div className="item asset">
          <span>Select Asset</span>
          <select value={formData.asset} onChange={(ev) => onSetFormData('asset', ev.target.value)}>
            {AssetOptions.map(({ id, name }) => (
              <option value={id}>{name}</option>
            ))}
          </select>
          <input type="number" className="amount" placeholder="Amount" value={formData.amount} onChange={(ev) => onSetFormData('amount', ev.target.value)} />
        </div>
        <div className="item">
          <span>Content</span>
          <div className="contentWrap">
            <div contentEditable className="content" id="content"></div>
            {isContentValid ? null : <span className="contentPlaceHolder">Please input content...</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileCreate;
