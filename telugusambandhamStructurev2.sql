--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15
-- Dumped by pg_dump version 14.15

-- Started on 2026-10-24 15:41:18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16384)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 3483 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 26470)
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_log (
    id integer NOT NULL,
    admin_id integer,
    action character varying(100) NOT NULL,
    target_uid integer,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_audit_log OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 26469)
-- Name: admin_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admin_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 26487)
-- Name: admin_impersonation_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_impersonation_tokens (
    id integer NOT NULL,
    token character varying(128) NOT NULL,
    uid integer NOT NULL,
    admin_id integer,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_impersonation_tokens OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 26486)
-- Name: admin_impersonation_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_impersonation_tokens ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admin_impersonation_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 26456)
-- Name: adminlogin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adminlogin (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    name character varying(150),
    role character varying(30) DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.adminlogin OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 26455)
-- Name: adminlogin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.adminlogin ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.adminlogin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 26425)
-- Name: app_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_settings (
    key character varying(100) NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.app_settings OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 26434)
-- Name: contact_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_views (
    id integer NOT NULL,
    viewer_id integer NOT NULL,
    viewed_uid integer NOT NULL,
    viewed_on date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_views OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 26433)
-- Name: contact_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contact_views ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contact_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 223 (class 1259 OID 25609)
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT no_self_conversation CHECK ((user1_id <> user2_id)),
    CONSTRAINT ordered_users CHECK ((user1_id < user2_id))
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 25608)
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conversations_id_seq OWNER TO postgres;

--
-- TOC entry 3484 (class 0 OID 0)
-- Dependencies: 222
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- TOC entry 227 (class 1259 OID 25756)
-- Name: email_otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_otps OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 25755)
-- Name: email_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_otps_id_seq OWNER TO postgres;

--
-- TOC entry 3485 (class 0 OID 0)
-- Dependencies: 226
-- Name: email_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_otps_id_seq OWNED BY public.email_otps.id;


--
-- TOC entry 225 (class 1259 OID 25634)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    message text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_by_sender boolean DEFAULT false NOT NULL,
    deleted_by_receiver boolean DEFAULT false NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25633)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO postgres;

--
-- TOC entry 3486 (class 0 OID 0)
-- Dependencies: 224
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 221 (class 1259 OID 25499)
-- Name: proposal_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposal_responses (
    id integer NOT NULL,
    proposal_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    response_status character varying(20) NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.proposal_responses OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 25498)
-- Name: proposal_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proposal_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proposal_responses_id_seq OWNER TO postgres;

--
-- TOC entry 3487 (class 0 OID 0)
-- Dependencies: 220
-- Name: proposal_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proposal_responses_id_seq OWNED BY public.proposal_responses.id;


--
-- TOC entry 219 (class 1259 OID 25472)
-- Name: proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposals (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT no_self_proposal CHECK ((sender_id <> receiver_id))
);


ALTER TABLE public.proposals OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 25471)
-- Name: proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proposals_id_seq OWNER TO postgres;

--
-- TOC entry 3488 (class 0 OID 0)
-- Dependencies: 218
-- Name: proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proposals_id_seq OWNED BY public.proposals.id;


--
-- TOC entry 213 (class 1259 OID 16401)
-- Name: register; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.register (
    id integer NOT NULL,
    ufname name,
    email name,
    mobile name,
    password name
);


ALTER TABLE public.register OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 16400)
-- Name: register_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.register ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.register_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 217 (class 1259 OID 16416)
-- Name: userdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userdetails (
    id integer NOT NULL,
    uid integer,
    updateddate timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    about text,
    familyresidence text,
    fathername text,
    mothername text,
    fatheroccupation text,
    motheroccupation text,
    brothers text,
    sisters text,
    brothersmarried text,
    sistersmarried text,
    nakshtra text,
    padam text,
    rasi text,
    habitdrink text,
    habitsmoke text,
    degree text,
    jobcity text,
    diet text,
    maritalstatus text,
    partnerpreferences text
);


ALTER TABLE public.userdetails OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16415)
-- Name: userdetails_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.userdetails ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.userdetails_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 215 (class 1259 OID 16407)
-- Name: usergallery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usergallery (
    id integer NOT NULL,
    imagepath text COLLATE pg_catalog."C",
    isprofile boolean,
    uid integer,
    updateddate text,
    insertdate timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    imagepath_medium text,
    imagepath_thumb text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    watermarked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.usergallery OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16406)
-- Name: usergallery_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usergallery ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usergallery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 211 (class 1259 OID 16395)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    uid integer NOT NULL,
    ufname text,
    ulname text,
    udob text,
    utob text,
    ugender text,
    upob text,
    upresentloc text,
    uphone text,
    uheight text,
    ucaste text,
    uemail text,
    upassword text,
    ujob text,
    upackage text,
    relation text,
    ucreated text,
    ucountry text,
    ustate text,
    created_at timestamp without time zone,
    last_login timestamp without time zone,
    is_online boolean,
    status character varying(20) DEFAULT 'Active'::character varying,
    hide_email boolean DEFAULT false NOT NULL,
    hide_phone boolean DEFAULT false NOT NULL,
    hide_gallery boolean DEFAULT false NOT NULL,
    hide_picture boolean DEFAULT false NOT NULL,
    profile_status character varying(20) DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 16394)
-- Name: users_uid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN uid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_uid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3248 (class 2604 OID 25612)
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- TOC entry 3259 (class 2604 OID 25759)
-- Name: email_otps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_otps ALTER COLUMN id SET DEFAULT nextval('public.email_otps_id_seq'::regclass);


--
-- TOC entry 3253 (class 2604 OID 25637)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 3245 (class 2604 OID 25502)
-- Name: proposal_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_responses ALTER COLUMN id SET DEFAULT nextval('public.proposal_responses_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 25475)
-- Name: proposals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals ALTER COLUMN id SET DEFAULT nextval('public.proposals_id_seq'::regclass);


--
-- TOC entry 3320 (class 2606 OID 26477)
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3323 (class 2606 OID 26493)
-- Name: admin_impersonation_tokens admin_impersonation_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_impersonation_tokens
    ADD CONSTRAINT admin_impersonation_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3325 (class 2606 OID 26495)
-- Name: admin_impersonation_tokens admin_impersonation_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_impersonation_tokens
    ADD CONSTRAINT admin_impersonation_tokens_token_key UNIQUE (token);


--
-- TOC entry 3314 (class 2606 OID 26468)
-- Name: adminlogin adminlogin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adminlogin
    ADD CONSTRAINT adminlogin_email_key UNIQUE (email);


--
-- TOC entry 3316 (class 2606 OID 26464)
-- Name: adminlogin adminlogin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adminlogin
    ADD CONSTRAINT adminlogin_pkey PRIMARY KEY (id);


--
-- TOC entry 3318 (class 2606 OID 26466)
-- Name: adminlogin adminlogin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adminlogin
    ADD CONSTRAINT adminlogin_username_key UNIQUE (username);


--
-- TOC entry 3307 (class 2606 OID 26432)
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- TOC entry 3309 (class 2606 OID 26440)
-- Name: contact_views contact_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_views
    ADD CONSTRAINT contact_views_pkey PRIMARY KEY (id);


--
-- TOC entry 3311 (class 2606 OID 26442)
-- Name: contact_views contact_views_unique_per_day; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_views
    ADD CONSTRAINT contact_views_unique_per_day UNIQUE (viewer_id, viewed_uid, viewed_on);


--
-- TOC entry 3291 (class 2606 OID 25618)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 3303 (class 2606 OID 25765)
-- Name: email_otps email_otps_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_email_key UNIQUE (email);


--
-- TOC entry 3305 (class 2606 OID 25763)
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 25646)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3289 (class 2606 OID 25506)
-- Name: proposal_responses proposal_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_responses
    ADD CONSTRAINT proposal_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 3284 (class 2606 OID 25482)
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- TOC entry 3274 (class 2606 OID 16405)
-- Name: register register_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.register
    ADD CONSTRAINT register_pkey PRIMARY KEY (id);


--
-- TOC entry 3295 (class 2606 OID 25620)
-- Name: conversations unique_conversation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id);


--
-- TOC entry 3286 (class 2606 OID 25484)
-- Name: proposals unique_proposal; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT unique_proposal UNIQUE (sender_id, receiver_id);


--
-- TOC entry 3277 (class 2606 OID 16414)
-- Name: usergallery userProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergallery
    ADD CONSTRAINT "userProfile_pkey" PRIMARY KEY (id);


--
-- TOC entry 3279 (class 2606 OID 16423)
-- Name: userdetails userdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userdetails
    ADD CONSTRAINT userdetails_pkey PRIMARY KEY (id);


--
-- TOC entry 3272 (class 2606 OID 16399)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (uid);


--
-- TOC entry 3321 (class 1259 OID 26483)
-- Name: idx_admin_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_created ON public.admin_audit_log USING btree (created_at);


--
-- TOC entry 3312 (class 1259 OID 26453)
-- Name: idx_contact_views_viewer_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_views_viewer_day ON public.contact_views USING btree (viewer_id, viewed_on);


--
-- TOC entry 3292 (class 1259 OID 25631)
-- Name: idx_conversations_user1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_user1 ON public.conversations USING btree (user1_id);


--
-- TOC entry 3293 (class 1259 OID 25632)
-- Name: idx_conversations_user2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_user2 ON public.conversations USING btree (user2_id);


--
-- TOC entry 3326 (class 1259 OID 26501)
-- Name: idx_impersonation_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_impersonation_token ON public.admin_impersonation_tokens USING btree (token);


--
-- TOC entry 3296 (class 1259 OID 25662)
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- TOC entry 3297 (class 1259 OID 25665)
-- Name: idx_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read);


--
-- TOC entry 3298 (class 1259 OID 25664)
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- TOC entry 3299 (class 1259 OID 25663)
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- TOC entry 3280 (class 1259 OID 25495)
-- Name: idx_proposals_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proposals_receiver ON public.proposals USING btree (receiver_id);


--
-- TOC entry 3281 (class 1259 OID 25496)
-- Name: idx_proposals_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proposals_sender ON public.proposals USING btree (sender_id);


--
-- TOC entry 3282 (class 1259 OID 25497)
-- Name: idx_proposals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proposals_status ON public.proposals USING btree (status);


--
-- TOC entry 3287 (class 1259 OID 25512)
-- Name: idx_responses_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_responses_sender ON public.proposal_responses USING btree (sender_id);


--
-- TOC entry 3275 (class 1259 OID 26205)
-- Name: idx_usergallery_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usergallery_status ON public.usergallery USING btree (status);


--
-- TOC entry 3270 (class 1259 OID 26485)
-- Name: idx_users_profile_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_profile_status ON public.users USING btree (profile_status);


--
-- TOC entry 3337 (class 2606 OID 26478)
-- Name: admin_audit_log admin_audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.adminlogin(id);


--
-- TOC entry 3338 (class 2606 OID 26496)
-- Name: admin_impersonation_tokens admin_impersonation_tokens_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_impersonation_tokens
    ADD CONSTRAINT admin_impersonation_tokens_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3336 (class 2606 OID 26448)
-- Name: contact_views contact_views_viewed_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_views
    ADD CONSTRAINT contact_views_viewed_fkey FOREIGN KEY (viewed_uid) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3335 (class 2606 OID 26443)
-- Name: contact_views contact_views_viewer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_views
    ADD CONSTRAINT contact_views_viewer_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3330 (class 2606 OID 25621)
-- Name: conversations conversations_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3331 (class 2606 OID 25626)
-- Name: conversations conversations_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3332 (class 2606 OID 25647)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 3334 (class 2606 OID 25657)
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3333 (class 2606 OID 25652)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3329 (class 2606 OID 25507)
-- Name: proposal_responses proposal_responses_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_responses
    ADD CONSTRAINT proposal_responses_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;


--
-- TOC entry 3328 (class 2606 OID 25490)
-- Name: proposals proposals_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- TOC entry 3327 (class 2606 OID 25485)
-- Name: proposals proposals_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(uid) ON DELETE CASCADE;


-- Completed on 2026-10-24 15:41:20

--
-- PostgreSQL database dump complete
--

