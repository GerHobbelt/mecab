//------------------------------------------------------------------------------
// <auto-generated />
//
// This file was automatically generated by SWIG (http://www.swig.org).
// Version 3.0.12
//
// Do not make changes to this file unless you know what you are doing--modify
// the SWIG interface file instead.
//------------------------------------------------------------------------------

namespace MeCab {

public class Node : global::System.IDisposable {
  private global::System.Runtime.InteropServices.HandleRef swigCPtr;
  protected bool swigCMemOwn;

  internal Node(global::System.IntPtr cPtr, bool cMemoryOwn) {
    swigCMemOwn = cMemoryOwn;
    swigCPtr = new global::System.Runtime.InteropServices.HandleRef(this, cPtr);
  }

  internal static global::System.Runtime.InteropServices.HandleRef getCPtr(Node obj) {
    return (obj == null) ? new global::System.Runtime.InteropServices.HandleRef(null, global::System.IntPtr.Zero) : obj.swigCPtr;
  }

  public virtual void Dispose() {
    lock(this) {
      if (swigCPtr.Handle != global::System.IntPtr.Zero) {
        if (swigCMemOwn) {
          swigCMemOwn = false;
          throw new global::System.MethodAccessException("C++ destructor does not have public access");
        }
        swigCPtr = new global::System.Runtime.InteropServices.HandleRef(null, global::System.IntPtr.Zero);
      }
      global::System.GC.SuppressFinalize(this);
    }
  }

  public Node prev {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_prev_get(swigCPtr);
      Node ret = (cPtr == global::System.IntPtr.Zero) ? null : new Node(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public Node next {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_next_get(swigCPtr);
      Node ret = (cPtr == global::System.IntPtr.Zero) ? null : new Node(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public Node enext {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_enext_get(swigCPtr);
      Node ret = (cPtr == global::System.IntPtr.Zero) ? null : new Node(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public Node bnext {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_bnext_get(swigCPtr);
      Node ret = (cPtr == global::System.IntPtr.Zero) ? null : new Node(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public Path rpath {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_rpath_get(swigCPtr);
      Path ret = (cPtr == global::System.IntPtr.Zero) ? null : new Path(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public Path lpath {
    get {
      global::System.IntPtr cPtr = MeCabPINVOKE.Node_lpath_get(swigCPtr);
      Path ret = (cPtr == global::System.IntPtr.Zero) ? null : new Path(cPtr, false);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public string feature {
    get {
      string ret = MeCabPINVOKE.Node_feature_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public uint id {
    get {
      uint ret = MeCabPINVOKE.Node_id_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public ushort length {
    get {
      ushort ret = MeCabPINVOKE.Node_length_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public ushort rlength {
    get {
      ushort ret = MeCabPINVOKE.Node_rlength_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public ushort rcAttr {
    get {
      ushort ret = MeCabPINVOKE.Node_rcAttr_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public ushort lcAttr {
    get {
      ushort ret = MeCabPINVOKE.Node_lcAttr_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public ushort posid {
    get {
      ushort ret = MeCabPINVOKE.Node_posid_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public byte char_type {
    get {
      byte ret = MeCabPINVOKE.Node_char_type_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public byte stat {
    get {
      byte ret = MeCabPINVOKE.Node_stat_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public byte isbest {
    get {
      byte ret = MeCabPINVOKE.Node_isbest_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public float alpha {
    get {
      float ret = MeCabPINVOKE.Node_alpha_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public float beta {
    get {
      float ret = MeCabPINVOKE.Node_beta_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public float prob {
    set {
      MeCabPINVOKE.Node_prob_set(swigCPtr, value);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
    } 
    get {
      float ret = MeCabPINVOKE.Node_prob_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public short wcost {
    get {
      short ret = MeCabPINVOKE.Node_wcost_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public int cost {
    get {
      int ret = MeCabPINVOKE.Node_cost_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

  public string surface {
    get {
      string ret = MeCabPINVOKE.Node_surface_get(swigCPtr);
      if (MeCabPINVOKE.SWIGPendingException.Pending) throw MeCabPINVOKE.SWIGPendingException.Retrieve();
      return ret;
    } 
  }

}

}